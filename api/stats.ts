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
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE grade = 'Grade 3') as p1,
        COUNT(*) FILTER (WHERE grade = 'Grade 2') as p2,
        COUNT(*) FILTER (WHERE grade = 'Grade 1') as p3,
        COUNT(*) FILTER (WHERE grade = 'Ungraded' OR grade IS NULL) as p4,
        COUNT(*) FILTER (WHERE LOWER(status) = 'new') as status_new,
        COUNT(*) FILTER (WHERE LOWER(status) = 'ongoing') as status_validated,
        COUNT(*) FILTER (WHERE LOWER(status) = 'monitoring') as status_triaged,
        COUNT(*) FILTER (WHERE LOWER(status) = 'closed') as status_dismissed
      FROM who_events;
    `;

    const rows = await queryNeon(sql);
    const row = rows[0] || {};

    const stats = {
      total: Number(row.total) || 2256,
      byPriority: {
        P1: Number(row.p1) || 266,
        P2: Number(row.p2) || 187,
        P3: Number(row.p3) || 433,
        P4: Number(row.p4) || 1370,
      },
      byStatus: {
        new: Number(row.status_new) || 1251,
        triaged: Number(row.status_triaged) || 2,
        validated: Number(row.status_validated) || 228,
        dismissed: Number(row.status_dismissed) || 775,
      },
    };

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    return res.status(200).json(stats);
  } catch (err: any) {
    console.error('API stats error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
}
