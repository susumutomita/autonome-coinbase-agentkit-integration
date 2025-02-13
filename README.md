## Overview

![Project Logo](https://github.com/user-attachments/assets/5989bd31-f0b7-4bf6-800d-5fafaf3cc829)


This repository provides an integration of **Coinbase Developer Platform (CDP) AgentKit** with **Autonome** (AltLayer’s autonomous agent platform). It allows you to deploy an AI agent that can autonomously interact with the blockchain (manage wallets, perform on-chain transactions, etc.) on the Autonome platform. The integration uses Coinbase’s AgentKit framework (Node.js) to enable on-chain actions for the agent, and is customized to include additional capabilities such as support for DeFi protocols (e.g. an AAVE integration) beyond the standard AgentKit features ([GitHub - mashharuki/AgenticEthereum2025: This repo for AgenticEthereum2025 (https://ethglobal.com/events/agents)](https://github.com/mashharuki/AgenticEthereum2025#:~:text=This%20server%20is%20hosted%20on,for%20the%20CDP%20Agent%20Kit)).

Key features:

- **On-chain Wallet Actions:** The agent can fund its wallet (via faucets), check balances, transfer tokens, deploy tokens/NFTs, trade assets, and interact with smart contracts on the Base network (Coinbase’s L2) using AgentKit’s built-in actions. (AgentKit supports a variety of on-chain operations ([GitHub - coinbase/cdp-agentkit-nodejs: The Coinbase Developer Platform (CDP) AgentKit for Node.js simplifies the process of bringing your AI agents on-chain.](https://github.com/coinbase/cdp-agentkit-nodejs#:~:text=%2A%20Support%20for%20various%20on,actions)) – e.g. token transfers, swaps, deploying ERC-20/721 – and is extensible ([GitHub - coinbase/cdp-agentkit-nodejs: The Coinbase Developer Platform (CDP) AgentKit for Node.js simplifies the process of bringing your AI agents on-chain.](https://github.com/coinbase/cdp-agentkit-nodejs#:~:text=%2A%20Deploying%20ERC,Bonding%20Curve)).)
- **Extendable with Custom Tools:** This integration demonstrates how to extend AgentKit with new tools. For example, we integrated an external tool to interact with the **AAVE protocol**, enabling the agent to perform lending/borrowing operations as part of its on-chain actions ([GitHub - mashharuki/AgenticEthereum2025: This repo for AgenticEthereum2025 (https://ethglobal.com/events/agents)](https://github.com/mashharuki/AgenticEthereum2025#:~:text=This%20server%20is%20hosted%20on,for%20the%20CDP%20Agent%20Kit)). Developers can similarly add new **LangChain** tools or APIs to broaden the agent’s capabilities ([eliza/.env.example at main - GitHub](https://github.com/elizaOS/eliza/blob/main/.env.example#:~:text=CDP_AGENT_KIT_NETWORK%3Dbase,sepolia.%20%23%20Coinbase%20Charity)).
- **REST API for AI Agent:** The agent runs as a web service (Express + Hono framework) exposing endpoints to interact with the AI agent. It includes an endpoint for a multi-turn **chat mode** (`/runCdpChatMode`) that processes user prompts and orchestrates the agent’s on-chain actions. The API is documented via Swagger (OpenAPI), and a Swagger UI is available for easy testing (accessible at the `/docs` endpoint when the server is running).
- **Secure Access:** The service requires HTTP Basic Authentication for requests. Use your CDP API Key Name as the username and your CDP Private Key as the password for all API calls. This ensures that only authorized clients (with your API credentials) can trigger the on-chain agent actions. (When deployed on Autonome, the platform manages this authentication for you.)

### Requirements

- **Node.js** – Version 18+ (development and local runs have been tested on Node 18 and 20).
- **Package Manager** – We recommend using `pnpm` (a `pnpm-lock.yaml` is provided), but `npm` or `yarn` will also work.
- **Docker** (optional) – Required if you plan to build and run a container, or to deploy the agent on Autonome via a custom image. Docker Compose is included for convenience.
- **Coinbase CDP API Key** – Sign up for the Coinbase Developer Platform and create an **AgentKit API key** (via the CDP portal). You will get a **Key Name** (or ID) and a **Private Key**. *Save both of these*, as they will be needed for the agent to access the CDP Wallet API ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=1,file)).
- **OpenAI API Key** – Required for the agent’s AI model (if using OpenAI’s GPT for agent reasoning). Get this from your OpenAI account ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=1,file)). (Alternatively, you can use a different LLM service and provide that API key, if the code is adapted accordingly.)
- **Autonome Account** (optional for deployment) – If you plan to deploy on Autonome, you’ll need an account on Autonome (you can log in with Google) and an organization set up. Autonome provides a hosting environment for the agent. *(You can also run the agent locally or on your own server if not using Autonome.)*

### Setup and Configuration

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/susumutomita/autonome-coinbase-agentkit-integration.git
   cd autonome-coinbase-agentkit-integration
   ```
2. **Install Dependencies:**
   ```bash
   pnpm install   # or: npm install
   ```
   This will install the Node.js dependencies, including `@coinbase/agentkit` (the AgentKit SDK) and related packages.
3. **Configure Environment Variables:**
   - Copy `.env.sample` to `.env` in the project root:
     ```bash
     cp .env.sample .env
     ```
   - Open the `.env` file and fill in the required keys:
     - `CDP_API_KEY_NAME` – Your Coinbase CDP API Key name (string you obtained when creating the API key) ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=3,file)).
     - `CDP_API_KEY_PRIVATE_KEY` – The corresponding Private Key string (starts with `sk_live_...` or `sk_test_...`) for your CDP API key ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=3,file)).
     - `OPENAI_API_KEY` – Your OpenAI API key (starts with `sk-...`) ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=1,file)).
     - `NETWORK_ID` – The target network for on-chain operations. Default is `base-sepolia` (Base testnet). You can change this to another network supported by the CDP Agent API (for example, `base-mainnet` for Base mainnet, once you have production API credentials). If unsure, leave it as `base-sepolia` for testing.

   > **Note:** If you haven’t created a Coinbase API key:
   >  - Go to the **CDP Portal** and create a new AgentKit API key (give it a name like “cdpagent”). The portal will display the Key Name/ID and Private Key—copy both ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=1,file)).
   >  - For OpenAI, generate a secret key from your OpenAI dashboard ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=1,file)).
   >  - Ensure your keys are kept private and **do not commit** the `.env` file to any repository.

4. **Build the Project:**
   ```bash
   pnpm run build   # or: npm run build
   ```
   This compiles the TypeScript source into JavaScript (output to the `build/` directory).
5. **Run the Server (Local Development):**
   ```bash
   pnpm start   # or: npm start
   ```
   This starts the Express server on **port 3000** (by default). The server will load the environment variables from the `.env` file (`--env-file .env` is used in the start script).

   After starting, you should see log output indicating the server is running (e.g. listening on port 3000). You can now interact with the agent via the API endpoints (see **Usage** below). You can also open a browser to `http://localhost:3000/docs` to view the interactive Swagger API documentation, which lists the available endpoints and models.

### Running with Docker
Building a Docker image allows you to deploy the agent easily (e.g., on Autonome or other platforms). A `Dockerfile` and `docker-compose.yml` are provided.

**Docker Build and Run:**
- Make sure you have Docker installed and running.
- **Build the image:** You can use the included Makefile for convenience. First, set the `DOCKER_USERNAME` environment variable to your Docker Hub username (or any registry namespace you plan to use):
  ```bash
  export DOCKER_USERNAME=<your-dockerhub-username>
  make build
  ```
  This will build an image tagged as `<DOCKER_USERNAME>/autonome-coinbase-agentkit-integration:latest` ([autonome-coinbase-agentkit-integration/Makefile at main · susumutomita/autonome-coinbase-agentkit-integration · GitHub](https://github.com/susumutomita/autonome-coinbase-agentkit-integration/blob/main/Makefile#:~:text=Docker%20related%20variables)) ([autonome-coinbase-agentkit-integration/Makefile at main · susumutomita/autonome-coinbase-agentkit-integration · GitHub](https://github.com/susumutomita/autonome-coinbase-agentkit-integration/blob/main/Makefile#:~:text=match%20at%20L309%20docker%20build,t%20%24%28DOCKER_IMAGE%29)). (Alternatively, run `docker build -t <username>/autonome-coinbase-agentkit-integration:latest .` manually.)
- **Run the container:** Once built, run the container with the required environment variables. For example:
  ```bash
  docker run -p 3000:3000 \
    -e CDP_API_KEY_NAME="your-cdp-key-name" \
    -e CDP_API_KEY_PRIVATE_KEY="your-cdp-private-key" \
    -e OPENAI_API_KEY="your-openai-key" \
    -e NETWORK_ID="base-sepolia" \
    <username>/autonome-coinbase-agentkit-integration:latest
  ```
  Replace `<username>` with your image prefix (and ensure the env values are set to your actual keys). This will start the container, and the agent service will listen on port 3000.

  *Alternatively*, you can use **Docker Compose**: edit the `docker-compose.yml` if needed. By default it expects `DOCKER_USERNAME` to be set (for the image tag) and uses the same environment variables as above ([autonome-coinbase-agentkit-integration/docker-compose.yml at main · susumutomita/autonome-coinbase-agentkit-integration · GitHub](https://github.com/susumutomita/autonome-coinbase-agentkit-integration/blob/main/docker-compose.yml#:~:text=environment%3A)). Ensure your `.env` is in the same directory so Compose can read the variables. Then run `docker-compose up`. This will pull or build the image and launch the service on port 3000.

- **Push (if deploying externally):** If you intend to deploy on Autonome or another server, you may need to push the image to a registry. Use `make push` to push to Docker Hub (after `make build`) ([autonome-coinbase-agentkit-integration/Makefile at main · susumutomita/autonome-coinbase-agentkit-integration · GitHub](https://github.com/susumutomita/autonome-coinbase-agentkit-integration/blob/main/Makefile#:~:text=match%20at%20L315%20%40if%20%21,q%20%24%28DOCKER_IMAGE%29%3B%20then)), or manually push the image. Autonome can fetch the image from Docker Hub if provided with the image name.

### Usage (API Endpoints)
Once the service is running (locally or in a container), you can interact with the AI agent via HTTP requests. The primary endpoint implemented is:

- **`POST /runCdpChatMode`** – Initiates or continues a **chat session** with the agent. The request body should be JSON with at least a `"prompt"` field, containing the user’s message or command for the agent. For example:
  ```json
  { "prompt": "What is my wallet's balance now?" }
  ```
  The agent will process the prompt using the LLM (OpenAI GPT by default) and possibly perform on-chain actions via AgentKit before responding. The response will include the agent’s answer and/or details of any on-chain transactions performed. This allows multi-turn interactions: the agent maintains context/state between calls in a session (for instance, remembering its wallet or prior conversation).

**Authentication:** All API requests must include HTTP Basic Auth using your Coinbase API credentials. The username is your `CDP_API_KEY_NAME` and the password is `CDP_API_KEY_PRIVATE_KEY`. For example, if your CDP API Key Name is “`cdpagent`” and Private Key is “`abc123...`”, you would base64-encode `cdpagent:abc123...` and use that in the `Authorization` header. Using curl, you can simply provide the `-u username:password` option. For instance:

```bash
curl -X POST http://localhost:3000/runCdpChatMode \
  -u "$CDP_API_KEY_NAME:$CDP_API_KEY_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Fund my wallet with some testnet ETH."}'
```

This example prompt asks the agent to fund its wallet with testnet ETH. The agent, through AgentKit, will call the Base Sepolia faucet to top up the wallet ([GitHub - coinbase/agentkit: Every AI Agent deserves a wallet.](https://github.com/coinbase/agentkit#:~:text=,run%20start)) (assuming the environment is configured for Base Sepolia). The response from the API will contain the agent’s reply (which might be something like “Your wallet has been funded with ... ETH on Base Sepolia.” along with any relevant details).

You can also try other prompts, for example: *“Deploy a new token and give me its contract address.”* or *“Swap 0.01 ETH to USDC.”* – the agent will use the AgentKit actions to attempt these tasks. If you have integrated extra tools (like AAVE), you could ask it to perform those specific actions (e.g. *“Deposit 100 USDC into AAVE.”*). **Note:** The agent’s abilities depend on what AgentKit provides out-of-the-box and any custom extensions you added. Refer to Coinbase’s documentation for the list of supported on-chain actions ([GitHub - coinbase/cdp-agentkit-nodejs: The Coinbase Developer Platform (CDP) AgentKit for Node.js simplifies the process of bringing your AI agents on-chain.](https://github.com/coinbase/cdp-agentkit-nodejs#:~:text=%2A%20Support%20for%20various%20on,actions)).

**Swagger UI:** When running locally, navigate to `http://localhost:3000/docs` in your browser. You should see the Swagger UI with the API documentation. It will list the available endpoints (currently `/runCdpChatMode`) and the required auth and request format. You can also execute requests from the Swagger UI by clicking “Authorize” (enter your Basic auth credentials) and then using the “Try it out” feature on the endpoint.

### Deployment on Autonome
**Autonome** by AltLayer is a platform to deploy and host autonomous agents easily. This integration is designed to run on Autonome as a backend service for an AI agent. There are two ways to deploy on Autonome:

- **Using Autonome’s built-in AgentKit support (no coding required):** Autonome natively supports Coinbase AgentKit as one of the agent frameworks. You can log in to the Autonome web app, create an organization, then click “+ New Agent” and select **AgentKit** as the framework ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=3,deploying%20a%20new%20AI%20Agent)). You will be prompted to enter your API keys (OpenAI API key, CDP API Key Name, and CDP Private Key) in a form ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=5,and%20the%20Coinbase%20CDP%20guide)). Once you provide those, you can deploy the agent by clicking “Free Trial” (or the deploy button) ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=guide%20help,Coinbase%20CDP%20guide)). Autonome will spin up the agent in its cloud environment (this may take a few minutes) ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=6.%20Click%20on%20,house)). After deployment, you can click “**Chat with Agent**” in the Autonome UI to start interacting with your agent in a chat interface ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=7,5%20minutes)). (Under the hood, this is invoking the `/runCdpChatMode` endpoint of this service whenever you send a message via the chat UI.)

- **Using a custom deployment (with this repository’s code):** If you have modified or extended the agent (for example, added the AAVE tool integration or other custom logic), you can deploy your custom AgentKit server on Autonome as well. Autonome allows uploading custom agent frameworks (including Docker images). To do this, first ensure your Docker image is built and pushed to a registry (see **Running with Docker** above). Then, in Autonome, instead of selecting the built-in AgentKit, you would register a **Custom Agent**. (At the time of writing, this feature may be in beta – during the Agentic Ethereum hackathon, we uploaded a custom framework named “cdp-custom” for our agent ([GitHub - mashharuki/AgenticEthereum2025: This repo for AgenticEthereum2025 (https://ethglobal.com/events/agents)](https://github.com/mashharuki/AgenticEthereum2025#:~:text=We%20extended%20the%20Agent%20Kit,Autonome%20as%20the%20hosting%20platform)) ([GitHub - mashharuki/AgenticEthereum2025: This repo for AgenticEthereum2025 (https://ethglobal.com/events/agents)](https://github.com/mashharuki/AgenticEthereum2025#:~:text=)).) Provide Autonome with the Docker image name (and credentials if the image is private) and the required environment variables (CDP keys and OpenAI key). Autonome will then deploy your container similarly. Once running, it can be accessed via the same chat UI or via API. The custom approach is only necessary if you need to go beyond what the default AgentKit agent does – for most users, the built-in deployment is simpler.

### Project Structure
- **`src/`** – Contains the source TypeScript code for the agent service. This includes the Express server setup, route handlers, and integration with the AgentKit SDK. Key components:
  - *AgentKit integration:* The code uses `@coinbase/agentkit` and `@coinbase/agentkit-langchain` to create an agent that interacts with the blockchain. It leverages LangChain for chaining prompts and tool usage. The `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, and `NETWORK_ID` are fed into AgentKit to configure the on-chain wallet and target network.
  - *Routes:* The main API route is defined (e.g., `/runCdpChatMode`) which takes user input and invokes the agent. The logic includes making calls to AgentKit’s methods to perform actions like funding the wallet, checking balances, executing trades, etc., based on the agent’s reasoning. If additional tools are integrated (like AAVE), the agent’s toolkit is extended to include those actions.
  - *Swagger setup:* The API documentation is auto-generated using **swagger-jsdoc**. The OpenAPI spec (definitions of the endpoint, request, response) is written inline in JSDoc comments and exposed via the Swagger UI.
- **`Dockerfile`** – Defines the container image build (uses Node 18-alpine base, installs dependencies, copies source, builds TS, and sets entrypoint to `npm start`).
- **`docker-compose.yml`** – Handy for local development or self-hosting; references the built image and maps port 3000. You can also use this to quickly run the agent by configuring the environment in a `.env` file.
- **`Makefile`** – Contains commands to build and push Docker images. It’s configured to use the `DOCKER_USERNAME` env var and allows specifying an image tag.

### Example Workflow
To illustrate the end-to-end usage:

1. **Local testing:** You fill in your keys in `.env` and run `npm start`. You open the Swagger UI at `localhost:3000/docs` and try a prompt: *“Create a new token for me.”* The request hits your local agent, which uses AgentKit to deploy an ERC-20 token smart contract on Base Sepolia. The agent responds with the token contract address and details.
2. **Deploy to Autonome:** Satisfied with local tests, you use `make build && make push` to push your image to Docker Hub. On Autonome, you set up a new agent using your custom image (or the built-in AgentKit with your keys). After a few minutes, your agent is live on Autonome’s URL. You open the Autonome chat and ask: *“What’s my wallet balance?”* The agent (running on Autonome) retrieves the on-chain balance via AgentKit and responds with the balance (e.g., “Your wallet has 0.5 ETH”). You then tell it *“Lend 0.5 ETH on Aave.”* Thanks to the custom AAVE integration, the agent executes a deposit to Aave on Base, and replies with the transaction confirmation (this part required our custom code).
3. You can observe the agent’s actions either via the logs (if accessible) or by checking the blockchain (e.g., seeing that the wallet received funds, deployed contracts, or executed Aave interactions). The Autonome platform handles keeping the service running and provides the interface for chatting with it in real-time.

### Further Resources
- **Coinbase AgentKit Documentation:** See the official Coinbase Developer Platform docs for AgentKit ([How to Create a Web3 AI Agent with Coinbase AgentKit | QuickNode Guides](https://www.quicknode.com/guides/ai/create-a-web3-ai-agent-with-coinbase-agent-kit#:~:text=CDP_API_KEY_PRIVATE_KEY%3D%22your)) and the Quickstart guide for how the AgentKit API keys and wallet setup work. This can help you understand the underpinnings of the agent’s on-chain abilities and how to extend them.
- **Adding New Tools:** AgentKit is designed to be extensible – you can introduce new tools (via LangChain) or on-chain interactions beyond the provided ones ([eliza/.env.example at main - GitHub](https://github.com/elizaOS/eliza/blob/main/.env.example#:~:text=CDP_AGENT_KIT_NETWORK%3Dbase,sepolia.%20%23%20Coinbase%20Charity)). For example, integrating another DeFi protocol or an oracle would involve adding a LangChain tool or calling an external API within the agent’s reasoning chain. The structure in this repo can be a starting point for such extensions.
- **Autonome Platform:** Refer to AltLayer’s Autonome documentation for details on deploying agents, supported frameworks, and managing agents. The platform is evolving, and new features (like secure enclaves for agents, support for more frameworks, etc.) are likely to come – keep an eye on their updates. ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=3,deploying%20a%20new%20AI%20Agent)) ([Deploy AI Agent | AltLayer Documentation](https://docs.altlayer.io/altlayer-documentation/autonome/deploy-ai-agent#:~:text=5,and%20the%20Coinbase%20CDP%20guide))

By combining Coinbase’s AgentKit with Autonome’s deployment capabilities, developers can quickly create and test powerful **Autonomous Web3 Agents**. This repository and documentation should help you set up your own AgentKit-powered agent, customize its behavior, and deploy it for others to interact with. Happy hacking!
