from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any


@dataclass
class _Node:
    key: str
    value: Any
    prev: "_Node | None" = None
    next: "_Node | None" = None


class LRUCache:
    """
    Hash map + doubly linked list LRU cache.

    - O(1) average get
    - O(1) average put
    - Evicts the least recently used key when capacity is full
    """

    def __init__(self, capacity: int = 128):
        self.capacity = max(1, capacity)
        self._nodes: dict[str, _Node] = {}
        self._head = _Node("__head__", None)
        self._tail = _Node("__tail__", None)
        self._head.next = self._tail
        self._tail.prev = self._head
        self._lock = Lock()

    def get(self, key: str):
        with self._lock:
            node = self._nodes.get(key)
            if not node:
                return None
            self._move_to_front(node)
            return node.value

    def put(self, key: str, value: Any):
        with self._lock:
            node = self._nodes.get(key)
            if node:
                node.value = value
                self._move_to_front(node)
                return

            node = _Node(key=key, value=value)
            self._nodes[key] = node
            self._insert_after_head(node)

            if len(self._nodes) > self.capacity:
                self._evict_lru()

    def clear(self):
        with self._lock:
            self._nodes.clear()
            self._head.next = self._tail
            self._tail.prev = self._head

    def stats(self):
        with self._lock:
            return {"capacity": self.capacity, "size": len(self._nodes)}

    def _move_to_front(self, node: _Node):
        self._detach(node)
        self._insert_after_head(node)

    def _insert_after_head(self, node: _Node):
        first = self._head.next
        node.prev = self._head
        node.next = first
        self._head.next = node
        if first:
            first.prev = node

    def _detach(self, node: _Node):
        prev_node = node.prev
        next_node = node.next
        if prev_node:
            prev_node.next = next_node
        if next_node:
            next_node.prev = prev_node

    def _evict_lru(self):
        lru = self._tail.prev
        if not lru or lru is self._head:
            return
        self._detach(lru)
        self._nodes.pop(lru.key, None)


catalog_cache = LRUCache(capacity=256)
