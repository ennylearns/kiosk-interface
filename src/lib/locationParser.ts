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

function fuzzyMatch(query: string, target: string): boolean {
  const queryWords = query.split(/\W+/).filter(Boolean);
  const targetWords = target.split(/\W+/).filter(Boolean);

  // A target matches if all its words fuzzy-match some word in the query
  for (const tWord of targetWords) {
    let matchFound = false;
    for (const qWord of queryWords) {
      if (tWord.length <= 4) {
        if (qWord === tWord) matchFound = true;
      } else if (tWord.length <= 7) {
        const dist = getLevenshteinDistance(qWord, tWord);
        if (dist <= 1) matchFound = true;
      } else {
        const dist = getLevenshteinDistance(qWord, tWord);
        if (dist <= 2) matchFound = true;
      }
      if (matchFound) break;
    }
    if (!matchFound) return false;
  }
  return true;
}

export function parseLocationQuery(query: string): string | null {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const loc of locations) {
    let currentMaxScore = 0;

    // Check name
    if (lowerQuery.includes(loc.name.toLowerCase())) {
      currentMaxScore = Math.max(currentMaxScore, loc.name.split(/\W+/).filter(Boolean).length * 2);
    } else if (fuzzyMatch(lowerQuery, loc.name.toLowerCase())) {
      currentMaxScore = Math.max(currentMaxScore, loc.name.split(/\W+/).filter(Boolean).length);
    }
    
    // Check keywords
    if (loc.keywords) {
      for (const keyword of loc.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          currentMaxScore = Math.max(currentMaxScore, keyword.split(/\W+/).filter(Boolean).length * 2);
        } else if (fuzzyMatch(lowerQuery, keyword.toLowerCase())) {
          currentMaxScore = Math.max(currentMaxScore, keyword.split(/\W+/).filter(Boolean).length);
        }
      }
    }

    if (currentMaxScore > highestScore) {
      highestScore = currentMaxScore;
      bestMatchId = loc.id;
    }
  }

  if (bestMatchId) {
    const matchedLoc = locations.find(l => l.id === bestMatchId);
    console.log(`Fuzzy matching resolved query "${query}" to: ${matchedLoc?.name} (Score: ${highestScore})`);
  } else {
    console.log(`Fuzzy matching found no match for query: "${query}"`);
  }

  return bestMatchId;
}
