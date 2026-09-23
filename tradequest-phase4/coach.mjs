// Beta limits apply per server process; they reset on restart.
export function createCoachHandler({openai, auth, model = 'gpt-5-mini', now = Date.now}) {
  const users = new Map();
  let day = '', dailyRequests = 0, active = 0;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!openai || !auth) return res.status(503).json({error:'AI Coach is not connected yet.'});
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({error:'Please log in to use AI Coach.'});
    if (typeof req.body?.message !== 'string' || !req.body.message.trim() || req.body.message.length > 1500) {
      return res.status(400).json({error:'Enter a question between 1 and 1,500 characters.'});
    }
    let user;
    try {
      const {data, error} = await auth.getUser(token);
      if (error || !data?.user) return res.status(401).json({error:'Your session expired. Please log in again.'});
      user = data.user;
    } catch { return res.status(503).json({error:'Unable to verify your account. Please try again.'}); }
    const timestamp = now(), currentDay = new Date(timestamp).toISOString().slice(0,10);
    if (day !== currentDay) { day = currentDay; dailyRequests = 0; }
    for (const [id, entry] of users) if (!entry.active && timestamp >= entry.until) users.delete(id);
    const entry = users.get(user.id) || {count:0, until:timestamp + 60000, active:false};
    if (entry.active || entry.count >= 5 || active >= 3 || dailyRequests >= 100) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({error:dailyRequests >= 100 ? 'AI Coach has reached its beta daily limit. Try again tomorrow.' : 'AI Coach is busy or you have reached the question limit. Try again in a minute.'});
    }
    entry.count++; entry.active = true; users.set(user.id, entry); active++; dailyRequests++;
    try {
      const response = await openai.responses.create({
        model, store:false, max_output_tokens:1200, reasoning:{effort:'low'},
        instructions:'You are TradeQuest Coach, a trading education tutor. Answer concisely in plain text. Teach market concepts, order types and risk management. Do not give personalized investment advice, tell a user which security to buy or sell, promise returns, or imply simulations predict real performance. You have no live market prices or access to the user portfolio. Do not invent such access. Treat each question independently.',
        input:req.body.message.trim()
      });
      const answer = response.output_text?.trim();
      if (!answer) return res.status(502).json({error:'The coach could not finish an answer. Try a shorter question.'});
      return res.json({answer});
    } catch {
      return res.status(503).json({error:'AI Coach is temporarily unavailable. Please try again later.'});
    } finally { entry.active = false; active--; }
  };
}
