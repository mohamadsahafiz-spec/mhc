export interface GenerateFindingInput {
  component: string;
  conditions: string[];
  actionRecommendation: string;
  engineerNote?: string;
}

export function generateLocalFallbackWording(input: GenerateFindingInput): string {
  const comp = input.component || 'Optical component';
  const condList = input.conditions && input.conditions.length > 0 
    ? input.conditions.join(', ').toLowerCase() 
    : 'observed issue';
  const action = input.actionRecommendation || 'further inspection';
  const note = input.engineerNote ? ` Observation: ${input.engineerNote.trim()}.` : '';

  let actionText = '';
  if (action === 'Replacement required') {
    actionText = 'Immediate component replacement is required to preserve beam quality and operational safety.';
  } else if (action === 'Recommended replacement') {
    actionText = 'Component replacement is recommended during the next scheduled maintenance window.';
  } else if (action === 'Clean') {
    actionText = 'Surface cleaning and inspection performed to restore optical transmission.';
  } else if (action === 'Monitor') {
    actionText = 'Component condition logged for continued monitoring during upcoming operating shifts.';
  } else {
    actionText = `Action recorded: ${action}.`;
  }

  return `Inspection of ${comp} identified ${condList}.${note} ${actionText}`;
}

export async function generateFindingWording(input: GenerateFindingInput): Promise<string> {
  try {
    const response = await fetch('/api/generate-finding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.wording) {
        return data.wording;
      }
    }
  } catch (err) {
    console.warn('AI finding generation endpoint call failed, using client fallback:', err);
  }

  return generateLocalFallbackWording(input);
}
