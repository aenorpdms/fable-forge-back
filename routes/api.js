const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

// Backend endpoint for generating the story
router.post("/generate-story", async (req, res) => {
  const { genre, fin, longueur } = req.body;

  const maxTokens = calculateMaxTokens(longueur); // Calcul du nombre total de tokens

  try {
    const userMessage = `Je souhaite créer une histoire de genre ${genre} d'environ ${longueur} pages, soit environ 300 tokens par page A4. Assurez-vous que l'histoire a une fin ${fin} en accord avec le genre. M'inspirer pour le personnage principal, le lieu de départ et l'époque. Créer aussi un titre avant le texte de l'histoire.`;

    const generatedStory = await generateStory(userMessage, maxTokens);

    // Diviser l'histoire en parties de 40 tokens
    const storyParts = splitStoryIntoParts(generatedStory, 40);

    res.json({ storyParts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error generating the story: ${error.message}` });
  }
});

// Fonction pour calculer le nombre total de tokens en fonction de la longueur
function calculateMaxTokens(longueur) {
  if (longueur === "1") {
    return Math.floor(Math.random() * (800 - 600 + 1) + 600);
  } else if (longueur === "2") {
    return Math.floor(Math.random() * (1500 - 800 + 1) + 800);
  } else if (longueur === "3") {
    return Math.floor(Math.random() * (4000 - 1500 + 1) + 1500);
  } else {
    return 1000; // Nombre de tokens par défaut si aucune sélection valide
  }
}

// Fonction pour générer l'histoire en plusieurs parties de 40 tokens
async function generateStory(prompt, maxTokens) {
  const result = [];
  let tokensGenerated = 0;

  while (tokensGenerated < maxTokens) {
    const tokensToGenerate = Math.min(40, maxTokens - tokensGenerated);
    const requestBody = createRequestBody(prompt, tokensToGenerate);

    const storyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!storyResponse.ok) {
      throw new Error("Error generating story from OpenAI API");
    }

    const storyData = await storyResponse.json();
    const storyPart = storyData.choices[0].message.content;
    result.push(storyPart);

    tokensGenerated += storyPart.length;
  }

  return result.join("");
}

// Fonction pour créer la demande vers l'API OpenAI
function createRequestBody(prompt, maxTokens) {
  return {
    model: "gpt-3.5-turbo-16k",
    messages: [
      { role: "system", content: "You are the best storyteller there is." },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 1,
  };
}

// Fonction pour diviser l'histoire en parties de tokens
function splitStoryIntoParts(story, partSize) {
  const storyParts = [];
  for (let i = 0; i < story.length; i += partSize) {
    storyParts.push(story.slice(i, i + partSize));
  }
  return storyParts;
}

module.exports = router;
