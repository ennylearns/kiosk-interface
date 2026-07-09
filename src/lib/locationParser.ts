import locations from '../data/locations.json';

function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateMatchScore(query: string, target: string): number {
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  const targetWords = target.toLowerCase().split(/\W+/).filter(Boolean);
  
  if (queryWords.length === 0 || targetWords.length === 0) return 0;

  let score = 0;

  // Exact substring match bonus
  if (query.toLowerCase().includes(target.toLowerCase())) {
    score += targetWords.length * 5; 
  } else if (target.toLowerCase().includes(query.toLowerCase())) {
    // If target includes query, that's also very good
    score += queryWords.length * 3;
  }

  // Word-by-word matching
  for (const tWord of targetWords) {
    let bestWordScore = 0;
    for (const qWord of queryWords) {
      if (qWord === tWord) {
        bestWordScore = Math.max(bestWordScore, 2);
      } else {
        const dist = getLevenshteinDistance(qWord, tWord);
        if (tWord.length <= 4 && dist === 0) {
           // Short words must match exactly
        } else if (tWord.length > 4 && tWord.length <= 7 && dist <= 1) {
          bestWordScore = Math.max(bestWordScore, 1);
        } else if (tWord.length > 7 && dist <= 2) {
          bestWordScore = Math.max(bestWordScore, 1);
        }
      }
    }
    score += bestWordScore;
  }
  
  return score;
}

export function parseLocationQuery(query: string): string | null {
  if (!query) return null;

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const loc of locations) {
    let currentMaxScore = 0;

    // Check name
    currentMaxScore = Math.max(currentMaxScore, calculateMatchScore(query, loc.name));
    
    // Check keywords
    if (loc.keywords) {
      for (const keyword of loc.keywords) {
        currentMaxScore = Math.max(currentMaxScore, calculateMatchScore(query, keyword));
      }
    }

    if (currentMaxScore > highestScore) {
      highestScore = currentMaxScore;
      bestMatchId = loc.id;
    }
  }

  // Define a minimum threshold for a match to avoid random hits
  // A threshold of 2 means at least one word matched exactly, or two long words had typos, 
  // or it was a substring match.
  if (bestMatchId && highestScore >= 2) {
    const matchedLoc = locations.find(l => l.id === bestMatchId);
    console.log(`Fuzzy matching resolved query "${query}" to: ${matchedLoc?.name} (Score: ${highestScore})`);
    return bestMatchId;
  } else {
    console.log(`Fuzzy matching found no match for query: "${query}" (Highest Score: ${highestScore})`);
    return null;
  }
}
