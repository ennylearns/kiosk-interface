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

function fuzzyWordMatch(qWord: string, tWord: string): boolean {
  if (tWord.length <= 4) {
    return qWord === tWord;
  } else if (tWord.length <= 7) {
    return getLevenshteinDistance(qWord, tWord) <= 1;
  } else {
    return getLevenshteinDistance(qWord, tWord) <= 2;
  }
}

export function parseLocationQuery(query: string): string | null {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\W+/).filter(Boolean);

  let bestMatchId: string | null = null;
  let highestScore = 0;

  for (const loc of locations) {
    let locScore = 0;

    const phrases = [loc.name.toLowerCase()];
    if (loc.keywords) {
      phrases.push(...loc.keywords.map(k => k.toLowerCase()));
    }

    for (const phrase of phrases) {
      // Exact substring match gets a very high score
      if (lowerQuery.includes(phrase)) {
        const score = phrase.length * 10;
        if (score > locScore) locScore = score;
        continue;
      }

      // Word overlap score
      const targetWords = phrase.split(/\W+/).filter(Boolean);
      let matchCount = 0;

      for (const tWord of targetWords) {
        for (const qWord of queryWords) {
          if (fuzzyWordMatch(qWord, tWord)) {
            matchCount++;
            break;
          }
        }
      }

      // Only consider it a match if at least half of the target phrase is present
      // or if there are multiple strong words matched.
      if (matchCount > 0 && (matchCount >= targetWords.length / 2 || matchCount >= 2)) {
        const score = (matchCount * 10) - ((targetWords.length - matchCount) * 2);
        if (score > locScore) locScore = score;
      }
    }

    if (locScore > highestScore) {
      highestScore = locScore;
      bestMatchId = loc.id;
    }
  }

  return highestScore > 0 ? bestMatchId : null;
}
