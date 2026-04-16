from collections import defaultdict

class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode)
        self.is_end = False
        self.words = set()

class SearchTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        word = word.strip().lower()
        if not word:
            return
        node = self.root
        for ch in word:
            node = node.children[ch]
            node.words.add(word)
        node.is_end = True

    def build(self, words):
        self.root = TrieNode()
        for word in words:
            self.insert(word)

    def suggest(self, prefix: str, limit: int = 8):
        prefix = prefix.strip().lower()
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]
        results = sorted(node.words)
        return results[:limit]
