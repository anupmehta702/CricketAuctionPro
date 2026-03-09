<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/18952fd0-a7bb-4e62-be1b-ced475f8ca20

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
4. TO run backend ,cd backend  && npm start
5. TO know the URL on which this app is loaded type env and check for WEB_HOST parameter
6. Ctrl+Shft+P for palette and type generate active tokens to get authorization bearer token for testing API via postman