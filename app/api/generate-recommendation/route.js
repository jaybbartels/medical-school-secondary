import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { userBackground, medicalSchoolName, question, questionNumber } = body;

    if (!userBackground || !medicalSchoolName || !question) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert medical school admissions counselor specializing in secondary application strategy.

A medical school applicant is preparing their secondary application for ${medicalSchoolName}.

APPLICANT BACKGROUND:
${userBackground}

SECONDARY QUESTION #${questionNumber}:
"${question}"

Please analyze this question and provide:
1. Key themes the school is looking for with this question
2. How this question relates to the school's mission and values
3. A recommended strategic approach to answering it
4. Specific elements from their background/resume they should highlight
5. Common pitfalls to avoid
6. 2-3 sentence opening hook suggestions to grab attention

Format your response with clear sections using markdown headers. Be specific and actionable.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const recommendationText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return Response.json({
      success: true,
      recommendation: recommendationText,
      questionId: body.questionId || null
    });

  } catch (error) {
    console.error('Error generating recommendation:', error);
    return Response.json(
      { error: 'Failed to generate recommendation: ' + error.message },
      { status: 500 }
    );
  }
}
