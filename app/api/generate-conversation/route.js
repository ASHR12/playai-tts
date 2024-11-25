import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
})

const DialogueSchema = z.object({
  conversation: z.array(
    z.object({
      speaker: z.enum(['Speaker 1', 'Speaker 2']),
      text: z.string(),
    })
  ),
})

export async function POST(req) {
  const { prompt } = await req.json()
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gemini-1.5-flash',
      messages: [
        {
          role: 'system',
          content: `Generate a structured podcast dialogue following this format:
                - Speaker 1 starts with a warm welcome and introduces themselves and the podcast topic
                - Speaker 2 introduces themselves and shares their expertise/connection to the topic
                - Both engage in an informative discussion about the topic
                - Include natural transitions, relevant examples, and engaging back-and-forth
                - End with Speaker 1 summarizing key points
                - Speaker 2 adds final thoughts
                - Speaker 1 closes with thank you and goodbye to listeners
                Keep the tone conversational, engaging, and professional throughout.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(DialogueSchema, 'conversation'),
    })

    // Format the structured response into the desired string format
    const story = completion.choices[0].message.parsed.conversation
      .map((msg) => `${msg.speaker}: ${msg.text}`)
      .join('\n')

    return Response.json({ story })
  } catch (error) {
    return Response.json(
      { error: 'Failed to generate dialogue' },
      { status: 500 }
    )
  }
}
