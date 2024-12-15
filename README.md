# Play AI - API

## Overview

This is a demo project built using Next.js, featuring a collection of small applications that show how to use the Play AI API effectively. The repo is regularly updated with new examples and applications, so you’ll always find something useful to explore the full potential of Play AI

## Support Me

If you enjoy this project and want to support me, consider buying me a coffee or visiting my personal website to join the membership!

<div style="display: flex; gap: 10px; margin-top: 10px;">
  <a href="https://buymeacoffee.com/aiforsuccess">
    <img src="https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD57?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee">
  </a>
  <a href="https://x.com/ai_for_success">
    <img src="https://img.shields.io/badge/Follow_me_on_Twitter/X-4A90E2?style=for-the-badge&logo=X&logoColor=white" alt="Follow me on Twitter/X">
  </a>
</div>

## Projects:

- **Narration**: Single Speaker - Websocket Implementation of Play3.0-mini model.
- **AI-Podcast**: Two Speaker - Asycn implementation of PlayDialog model.
- **AI-Podcast**: Two Speaker - Streaming implementation of PlayDialog model.
- **Voice to Image** - Web Embed feature of PlayAI.

### Resources

- [PlayDialog Developer Documentation](https://docs.play.ai/documentation/get-started/introduction)
- [API Access](https://play.ai/developers)

## Cloning the Repository

To clone the repository, use the following command:

```bash
git clone https://github.com/ASHR12/playai-tts
```

## Environment Variables and Important Configurations

Before running the application, you need to set up your environment variables. Create a `.env` file in the root of the project and add the following fields:

```
PLAY_AI_USER_ID=your_play_ai_user_id
PLAY_AI_API_KEY=your_play_ai_api_key
GEMINI_API_KEY=your_gemini_api_key
FAL_KEY=your fal api key for voice to image application.
```

## Configuration

`Note Also setup webEmbedId in page.js of voice-to-image`
Make sure to replace the placeholder values with your actual API keys.

## Running the Application

To run the application, follow these steps:

1. **Install Dependencies**: Navigate to the project directory and install the required dependencies.

   ```bash
   cd playai-tts
   npm install
   ```

2. **Start the Development Server**: Run the following command to start the development server.

   ```bash
   npm run dev
   ```

3. **Access the Application**: Open your browser and go to [http://localhost:3000](http://localhost:3000) to see the application in action.

## Using Google Gemini for Story Generation

This project uses the Google Gemini model for generating stories in the AI podcast. However, users can also utilize other models as the application is compatible with the OpenAI SDK. This flexibility allows for a wide range of creative possibilities in podcast content generation.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
