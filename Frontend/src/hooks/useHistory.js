import { useState, useCallback } from 'react';

export default function useHistory() {
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);

    const takeSnapshot = useCallback((nodes, edges) => {
        // Deep clone to ensure we don't accidentally mutate history
        const snapshot = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges))
        };
        // Keep last 30 actions
        setPast((p) => [...p.slice(-29), snapshot]);
        setFuture([]); // Clear redo stack on new action
    }, []);

    const undo = useCallback((currentNodes, currentEdges) => {
        if (past.length === 0) return null;

        const previousState = past[past.length - 1];
        const newPast = past.slice(0, -1);

        // Push current state to future
        setFuture((f) => [{
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges))
        }, ...f]);

        setPast(newPast);
        return previousState;
    }, [past]);

    const redo = useCallback((currentNodes, currentEdges) => {
        if (future.length === 0) return null;

        const nextState = future[0];
        const newFuture = future.slice(1);

        // Push current state to past
        setPast((p) => [...p, {
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges))
        }]);

        setFuture(newFuture);
        return nextState;
    }, [future]);

    const clearHistory = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, []);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        clearHistory
    };
}
