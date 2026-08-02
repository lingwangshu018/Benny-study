// Benny Study · Normalize space-separated class names before illustration integration
(function () {
  const originalAdd = DOMTokenList.prototype.add;
  if (originalAdd.__bennySpaceCompat) return;

  function compatibleAdd(...tokens) {
    const normalized = tokens.flatMap(token =>
      String(token || "").split(/\s+/).filter(Boolean)
    );
    return originalAdd.apply(this, normalized);
  }

  Object.defineProperty(compatibleAdd, "__bennySpaceCompat", { value: true });
  DOMTokenList.prototype.add = compatibleAdd;
})();
