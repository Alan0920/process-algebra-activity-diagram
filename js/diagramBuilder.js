// diagramBuilder.js
import { applyLayout } from "./layout.js";

export function buildDiagram(ast, options = {}) {
  let idCounter = 0;
  const nextId = () => `n${idCounter++}`;

  const nodes = [];
  const edges = [];
  const lanesSet = new Set();

  function addNode(type, extra = {}) {
    const node = { id: nextId(), type, ...extra };
    if (node.lane) lanesSet.add(node.lane);
    nodes.push(node);
    return node;
  }

  function addEdge(from, to, label = undefined) {
    const edge = label ? { from, to, label } : { from, to };
    edges.push(edge);
    return edge;
  }

  function connectMany(fromIds, toIds, label = undefined) {
    for (const f of fromIds) {
      for (const t of toIds) {
        addEdge(f, t, label);
      }
    }
  }

  /**
   * 建構一段 AST 節點清單
   * @param {Array} steps - 步驟陣列
   * @param {string[]} prevExitIds - 前一段落結束後的出口節點 ID 清單
   * @returns {string[]} 這一段落結束後的出口節點 ID 清單
   */
  function buildSteps(steps, prevExitIds) {
    let currentExits = [...prevExitIds];

    for (const step of steps || []) {
      if (!step || !step.type) continue;

      if (step.type === "sequence") {
        currentExits = buildSteps(step.steps, currentExits);
      } else if (step.type === "action") {
        const actNode = addNode("action", {
          label: step.label ?? "action",
          ...(step.lane ? { lane: step.lane } : {}),
          ...(step.x !== undefined ? { x: step.x } : {}),
          ...(step.y !== undefined ? { y: step.y } : {})
        });
        connectMany(currentExits, [actNode.id]);
        currentExits = [actNode.id];
      } else if (step.type === "alt") {
        const decisionNode = addNode("decision", { label: "alt" });
        const mergeNode = addNode("merge", { label: "merge" });
        connectMany(currentExits, [decisionNode.id]);

        for (const branch of step.branches || []) {
          const branchExits = buildSteps(branch.body || [], []);
          if (branchExits.length === 0) {
            // 空分支直接從 decision 連到 merge
            addEdge(decisionNode.id, mergeNode.id, branch.condition);
          } else {
            // 分支第一顆節點掛上條件標籤，最後出口連到 merge
            const firstBranchNodeId = findFirstReachable(branchExits[0]);
            addEdge(decisionNode.id, firstBranchNodeId, branch.condition);
            connectMany(branchExits, [mergeNode.id]);
          }
        }

        // 後續 continuation 從 mergeNode 繼續
        currentExits = [mergeNode.id];
      } else if (step.type === "fork") {
        const forkNode = addNode("fork", { label: "fork" });
        const joinNode = addNode("join", { label: "join" });
        connectMany(currentExits, [forkNode.id]);

        for (const branch of step.branches || []) {
          const branchExits = buildSteps(branch.body || [], []);
          if (branchExits.length === 0) {
            addEdge(forkNode.id, joinNode.id);
          } else {
            const firstBranchNodeId = findFirstReachable(branchExits[0]);
            addEdge(forkNode.id, firstBranchNodeId);
            connectMany(branchExits, [joinNode.id]);
          }
        }

        // 後續 continuation 從 joinNode 繼續
        currentExits = [joinNode.id];
      }
    }

    return currentExits;
  }

  // 輔助：若某子區塊出口對應的起點需精準取得，可在 buildSteps 回傳 { entryIds, exitIds }
  // 這裡先做簡化版：若子區塊只有單一線性起點，直接用第一顆加入的節點
  function findFirstReachable(fallbackId) {
    return fallbackId;
  }

  const startNode = addNode("initial");
  const finalExits = buildSteps(
    ast.type === "sequence" ? ast.steps : [ast],
    [startNode.id]
  );

  // 若需要終止節點（final），可在最後接上；不需要也可保留 finalExits
  if (options.addFinalNode) {
    const finalNode = addNode("final");
    connectMany(finalExits, [finalNode.id]);
  }

  const diagram = {
    nodes,
    edges,
    lanes: Array.from(lanesSet)
  };

  return applyLayout(diagram, options);
}