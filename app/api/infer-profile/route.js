import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { backgroundText } = body;

    if (!backgroundText) {
      return Response.json(
        { error: 'Missing background text' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert medical school admissions consultant. Analyze this applicant's resume/background and extract the following information. Be thorough and detailed.

APPLICANT BACKGROUND:
${backgroundText}

Extract and summarize:

1. CLINICAL EXPERIENCE: List all clinical experiences (shadowing, volunteering, work). Include type, duration, key learnings.

2. RESEARCH EXPERIENCE: List research projects, topics, publications, role. Include what you learned and impact.

3. LEADERSHIP & VOLUNTEER: List leadership roles, volunteer work, community involvement, impact made.

4. CAREER GOALS: What specialty/path are they interested in? Why? Long-term vision?

5. PERSONAL VALUES: What values drive them? What matters most to them professionally/personally?

6. UNIQUE STORY: What makes them unique? Any challenges overcome? Pivotal moments?

7. SKILLS & ACCOMPLISHMENTS: Key skills developed, achievements, awards, standout accomplishments.

Format your response as JSON with these exact keys:
{
  "clinical_experience": "...",
  "research_experience": "...",
  "leadership_volunteer": "...",
  "career_goals": "...",
  "personal_values": "...",
  "unique_story": "...",
  "skills_accomplishments": "..."
}

Be detailed and comprehensive. This will be used to create personalized medical school essays.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse profile data');
    }

    const profile = JSON.parse(jsonMatch[0]);

    return Response.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error inferring profile:', error);
    return Response.json(
      { error: 'Failed to infer profile: ' + error.message },
      { status: 500 }
    );
  }
}
