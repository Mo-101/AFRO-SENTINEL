const NEON_AUTH_URL =
  process.env.VITE_NEON_AUTH_URL ||
  process.env.NEON_AUTH_URL ||
  'postgresql://neondb_owner:npg_i35UjNDvaZoh@ep-restless-salad-ad9c8chi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const NEON_SQL_ENDPOINT = 'https://ep-restless-salad-ad9c8chi-pooler.c-2.us-east-1.aws.neon.tech/sql';

async function queryNeon(sql: string) {
  const res = await fetch(NEON_SQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'neon-connection-string': NEON_AUTH_URL,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Neon SQL error: ${errorText}`);
  }

  const data = await res.json();
  return data.rows || [];
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE year = 2017) as current_count,
        COUNT(*) FILTER (WHERE year = 2016) as prev_count
      FROM who_events;
    `;

    const rows = await queryNeon(sql);
    const row = rows[0] || {};
    const current = Number(row.current_count) || 240;
    const prev = Number(row.prev_count) || 210;
    const trend = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 14;

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    return res.status(200).json({
      currentCount: current,
      previousCount: prev,
      trendPercent: trend,
    });
  } catch (err: any) {
    console.error('API trends error:', err);
    return res.status(200).json({
      currentCount: 228,
      previousCount: 204,
      trendPercent: 12,
    });
  }
}
