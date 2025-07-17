import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface AIAnalysisResult {
  tags: string[];
  title: string;
  description: string;
  altText: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that analyzes images and extracts metadata for a media management system. 

For each image, provide:
1. Tags: A list of relevant keywords for search and categorization (focus on objects, people, actions, style, mood, colors)
2. Title: A concise, descriptive title for the image (3-8 words, suitable for display)
3. Description: A short, engaging summary (1-2 sentences) suitable for content management
4. Alt text: Descriptive text for accessibility and SEO (be specific and detailed)

Return your response as a JSON object with the following structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "title": "Descriptive Image Title",
  "description": "Brief description of the image",
  "altText": "Detailed alt text for accessibility"
}

Focus on being accurate, specific, and helpful for content discovery and accessibility.`;

export async function analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide tags, description, and alt text.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean and parse the JSON response (remove markdown code blocks if present)
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const analysis = JSON.parse(cleanContent) as AIAnalysisResult;
    
    // Validate the response structure
    if (!analysis.tags || !analysis.description || !analysis.altText) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    
    // Return fallback values if analysis fails
    return {
      tags: ['image', 'media'],
      title: 'Uploaded Image',
      description: 'Image uploaded to media manager',
      altText: 'Uploaded image',
    };
  }
}

export async function analyzeImageFromBuffer(imageBuffer: Buffer): Promise<AIAnalysisResult> {
  // Convert buffer to base64 data URL
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;
  
  try {
    return await analyzeImage(dataUrl);
  } catch (error) {
    console.error('Error in analyzeImageFromBuffer:', error);
    return {
      tags: ['image'],
      title: 'Uploaded Image',
      description: 'Uploaded image',
      altText: 'Uploaded image',
    };
  }
} 