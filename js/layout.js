// layout.js
export function applyLayout(diagram, options = {}) {
  const {
    startX = 300,
    startY = 40,
    levelGapY = 95,
    siblingGapX = 180,
    externalCoords = {}
  } = options;

  const { nodes, edges } = diagram;
  if (nodes.length === 0) return diagram;

  // 1. 以有向邊計算每個節點的深度層級（rank），避免分支前後重疊
  const adj = new Map();
  const inDegree = new Map();
  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  edges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
  });

  const rank = new Map();
  const queue = [];
  nodes.forEach((n) => {
    if ((inDegree.get(n.id) || 0) === 0) {
      rank.set(n.id, 0);
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const curr = queue.shift();
    const currRank = rank.get(curr) || 0;
    for (const next of adj.get(curr) || []) {
      const nextRank = Math.max(rank.get(next) || 0, currRank + 1);
      rank.set(next, nextRank);
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  // 2. 將同一 rank 的節點分組，左右均勻分散 x
  const levels = new Map();
  nodes.forEach((n) => {
    const r = rank.get(n.id) ?? 0;
    if (!levels.has(r)) levels.set(r, []);
    levels.get(r).push(n);
  });

  levels.forEach((group, r) => {
    const count = group.length;
    group.forEach((node, idx) => {
      const defaultX = startX + (idx - (count - 1) / 2) * siblingGapX;
      const defaultY = startY + r * levelGapY;

      const ext = externalCoords[node.id];
      node.x = ext?.x ?? node.x ?? defaultX;
      node.y = ext?.y ?? node.y ?? defaultY;
    });
  });

  return diagram;
}