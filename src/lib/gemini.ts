import { GoogleGenAI } from "@google/genai";
import { Logger } from "./logger";

// Use environment variable for API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ResearchResult {
    topic: string;
    sourceUrl?: string;
    sourceTitle?: string;
}

/**
 * Research trending topics using Gemini AI
 */
export async function researchTrendingTopics(niche: string, userId?: string): Promise<ResearchResult[]> {
    const model = "gemini-2.0-flash-exp";

    const prompt = `
    Find 5 currently trending or highly relevant topics related to "${niche}" for today.
    Focus on news, debates, or emerging trends that would make good LinkedIn content.
    
    Format the output strictly as a list where each line is:
    TOPIC: [The Topic Headline]
    
    Do not add numbering or bullet points that aren't part of the format.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
        });

        const candidate = response.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || "";

        const lines = text.split("\n");
        const topics: ResearchResult[] = [];

        lines.forEach((line) => {
            if (line.includes("TOPIC:")) {
                const topicText = line.split("TOPIC:")[1].trim();
                const source = {
                    uri: `https://www.google.com/search?q=${encodeURIComponent(topicText)}`,
                    title: "Google Search"
                };

                topics.push({
                    topic: topicText,
                    sourceUrl: source.uri,
                    sourceTitle: source.title,
                });
            }
        });

        // Fallback parsing if no TOPIC: prefix found
        if (topics.length === 0) {
            lines.forEach((line) => {
                const cleaned = line.replace(/^[\d-.*]+/, "").trim();
                if (cleaned.length > 10 && !cleaned.toUpperCase().includes("TOPIC")) {
                    topics.push({
                        topic: cleaned,
                        sourceUrl: "#",
                        sourceTitle: "AI Generated",
                    });
                }
            });
        }

        // Log successful research
        await Logger.info("USER_SEARCH", `Researched topics for niche: ${niche}`, {
            topicCount: topics.length,
            niche
        }, userId);

        return topics.slice(0, 10);
    } catch (error) {
        console.error("Research error:", error);
        await Logger.error("SYSTEM_ERROR", "Topic research failed", { niche, error: String(error) }, userId);
        return [];
    }
}

/**
 * Generate LinkedIn post content using Gemini AI
 * Optimized for LinkedIn 2025 Algorithm
 */
export async function generateLinkedInPost(topic: string, niche: string, userId?: string): Promise<string> {
    const model = "gemini-2.0-flash-exp";

    const prompt = `
You are an expert LinkedIn copywriter specializing in the "${niche}" industry.
Write a high-engagement LinkedIn post about: "${topic}".

LINKEDIN 2025 ALGORITHM RULES:

📏 LENGTH & STRUCTURE:
- Total length: 1,400-2,000 characters
- Write 8-12 paragraphs, each with 2-3 sentences
- Use short sentences (under 20 words each)
- Add ONE blank line between paragraphs (not after every sentence)
- Write at Grade 5-7 reading level (simple words)

🪝 HOOK (First paragraph - CRITICAL):
- Start with a BOLD or CONTRARIAN statement
- Challenge conventional wisdom or reveal something unexpected
- Make it punchy and scroll-stopping

✍️ BODY:
- Each paragraph should have 2-3 related sentences
- Use "you" to speak directly to the reader  
- Include practical insights or lessons
- Add 3-5 emojis to highlight key points (not every paragraph)

❓ ENDING:
- End with a SPECIFIC question that invites discussion
- Make it easy to answer with personal experience

🚫 AVOID:
- NO hashtags (they reduce reach)
- NO links in the post
- NO starting with "I"
- NO jargon or buzzwords

Write the post now:
`;


    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
        });

        const candidate = response.candidates?.[0];
        const content = candidate?.content?.parts?.[0]?.text || "Failed to generate content.";

        // Log generation
        await Logger.info("GENERATE_POST", "Generated LinkedIn post", { topic, niche, contentLength: content.length }, userId);

        return content;
    } catch (error) {
        console.error("Generation error:", error);
        await Logger.error("SYSTEM_ERROR", "Post generation failed", { topic, error: String(error) }, userId);
        return "Error generating content. Please check your API key.";
    }
}
