export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptions } = req.body;

    if (!subscriptions) {
      return res.status(400).json({ error: 'No subscriptions provided' });
    }

    const prompt = `Analyze these subscriptions and provide money-saving recommendations.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanation.

Required JSON structure:
{
  "summary": {
    "recommendation_count": <number>,
    "total_savings": <number>
  },
  "table": [
    {
      "Category": "<string>",
      "Current Subscription & Price": "<string>",
      "Applicable Bundle / Perk / Credit": "<string>",
      "Estimated Savings": <number>
    }
  ],
  "total_row": {
    "Total Estimated Savings": <number>
  }
}

Look for:
- Family plans vs individual plans
- Credit card perks (Amex, Chase Sapphire, etc.)
- Bundle opportunities (Disney+/Hulu/ESPN+)
- Student/military/senior discounts
- Annual vs monthly pricing savings
- Duplicate services
- Free trials available

User subscriptions:
${subscriptions}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a subscription optimization expert. Always return valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let output = data.choices[0].message.content;

    // Clean up potential markdown
    output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(output);

    // Validate structure
    if (!parsed.summary || !parsed.table || !parsed.total_row) {
      throw new Error('Invalid response structure from AI');
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze subscriptions',
      details: error.message 
    });
  }
}
