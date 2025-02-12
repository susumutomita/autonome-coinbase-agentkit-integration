import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  erc721ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

// 環境変数の検証
function validateEnvironment(): void {
  const missingVars: string[] = [];
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
  if (!process.env.NETWORK_ID) {
    console.warn("NETWORK_ID not set, defaulting to base-sepolia");
  }
}

validateEnvironment();

const WALLET_DATA_FILE = "wallet_data.txt";

async function initializeAgent() {
  console.log("Initializing agent...");
  const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
  let walletDataStr: string | null = null;
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      console.log("Wallet data read from file");
    } catch (error) {
      console.error("Error reading wallet data file", error);
    }
  }

  const config = {
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
    ),
    cdpWalletData: walletDataStr || undefined,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  };

  const walletProvider = await CdpWalletProvider.configureWithWallet(config);
  console.log("Wallet provider configured");

  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      wethActionProvider(),
      pythActionProvider(),
      walletActionProvider(),
      erc20ActionProvider(),
      erc721ActionProvider(),
      cdpApiActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        ),
      }),
      cdpWalletActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        ),
      }),
    ],
  });
  console.log("AgentKit initialized");

  const tools = await getLangChainTools(agentkit);
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "CDP AgentKit Chatbot" },
  };
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
      You are a helpful agent that can interact onchain using Coinbase Developer Platform AgentKit.
      If you ever need funds, request them appropriately.
      Be concise and helpful.
    `,
  });
  console.log("Agent created");

  const exportedWallet = await walletProvider.exportWallet();
  fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
  console.log("Wallet data exported and saved");

  return { agent, config: agentConfig };
}

// Swagger の設定
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Agent API",
    version: "1.0.0",
    description: "API documentation for the Coinbase AgentKit based service",
  },
  servers: [
    {
      url: "http://localhost:3000",
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ["./src/index.ts"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

async function startAgentServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  app.use(express.json());

  // Swagger UI のエンドポイント
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  /**
   * @swagger
   * /message:
   *   post:
   *     summary: Chat with the agent
   *     description: Sends a text message to the agent and returns its response.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 example: "Hello, Agent!"
   *     responses:
   *       200:
   *         description: Agent response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 text:
   *                   type: string
   *                   example: "This is the agent's response."
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  app.post("/message", async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      console.error("Invalid request", req.body);
      return res
        .status(400)
        .json({ error: "Invalid request: 'message' field is required." });
    }
    if (message === "healthz") {
      return res.status(200).json({ status: "ok" });
    }
    console.log("Processing chat request:", message);
    try {
      const { agent, config } = await initializeAgent();
      const stream = await agent.stream(
        { messages: [new HumanMessage(message)] },
        config,
      );
      let fullResponse = "";
      for await (const chunk of stream) {
        if (
          "agent" in chunk &&
          chunk.agent.messages &&
          chunk.agent.messages[0]
        ) {
          fullResponse += chunk.agent.messages[0].content;
        }
      }
      console.log("Agent response:", fullResponse);
      res.json({ text: fullResponse });
    } catch (error) {
      console.error("Error processing chat request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`Agent REST server is listening on port ${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
  });
}

if (require.main === module) {
  startAgentServer().catch((error) => {
    console.error("Failed to start agent server:", error);
    process.exit(1);
  });
}
