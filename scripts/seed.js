const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HEADERS = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function ghFetch(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchAllRepos(login) {
  let allRepos = [];
  let page = 1;
  while (true) {
    const repos = await ghFetch(`https://api.github.com/users/${login}/repos?sort=stars&per_page=100&direction=desc&page=${page}`);
    await delay(100);
    allRepos = allRepos.concat(repos);
    if (repos.length < 100) break;
    page++;
  }
  return allRepos;
}

async function main() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  console.log('Connected to database');

  const existing = await db.query('SELECT "login", "publicRepos" FROM "Candidate"');
  const candidates = existing.rows;
  console.log(`Updating all repos for ${candidates.length} candidates...`);

  let updated = 0;

  for (const { login, publicRepos } of candidates) {
    try {
      const allRepos = await fetchAllRepos(login);

      const languageSet = new Set();
      let totalStars = 0;
      const repoData = allRepos
        .filter(r => !r.fork)
        .map(r => {
          if (r.language) languageSet.add(r.language);
          totalStars += r.stargazers_count || 0;
          return {
            name: r.name,
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            language: r.language,
            description: r.description || '',
            url: r.html_url,
            updatedAt: r.updated_at,
          };
        });

      const languages = Array.from(languageSet);

      await db.query(`
        UPDATE "Candidate"
        SET "topRepos" = $1, "languages" = $2, "totalStars" = $3, "updatedAt" = NOW()
        WHERE "login" = $4
      `, [JSON.stringify(repoData), JSON.stringify(languages), totalStars, login]);

      updated++;
      console.log(`  [${updated}/${candidates.length}] ${login} - ${repoData.length} repos`);
    } catch (err) {
      console.error(`  Error updating ${login}: ${err.message}`);
    }
  }

  console.log(`\nDone! Updated ${updated} candidates.`);
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
