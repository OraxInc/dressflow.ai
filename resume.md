# DressFlow AI — Resume des modifications

## Contexte
App React Native / Expo 56 (RN 0.85, React 19, new architecture Fabric activée par défaut).

---

## Problème identifié : boutons invisibles après upload image

### Cause racine
`KeyboardAvoidingView` avec `behavior="height"` sur Android calcule sa hauteur via `onLayout`.
Avec la **nouvelle architecture (Fabric)** de RN 0.85, une vue `position: absolute` sans dimensions
explicites rapporte `height: 0` dans `onLayout`, ce qui force le KAV à rendre son contenu à hauteur 0.
Résultat : toute la barre (attach, magic, crayon, gen) est invisible sur Android.

### Fix appliqué (tous les 3 écrans)
```tsx
// Avant
behavior={Platform.OS === "ios" ? "padding" : "height"}

// Après
behavior={Platform.OS === "ios" ? "padding" : undefined}
```
`undefined` sur Android = le KAV agit comme une `View` normale, pas d'ajustement de hauteur.

### Autre fix : zIndex
Ajout de `zIndex: 100` sur `inputLayer` pour garantir le rendu par-dessus `imageWrap` dans Fabric.

---

## Fichiers modifiés

### `app/tab/inpaint.tsx`
- Fix KAV `behavior` Android → `undefined`
- Ajout `zIndex: 100` sur `inputLayer`
- Fix `drawingSvg` : `StyleSheet.absoluteFillObject` → propriétés inline
  (le type TS de RN 0.85 n'exporte plus `absoluteFillObject`)

### `app/tab/style.tsx` — réécriture complète
**Avant :** Seulement bouton Attacher + input text

**Après :**
- Outils **Attacher** (image de référence)
- Outil **Magic** (trait fin blanc lumineux, sélection précise)
- Outil **Crayon / Brush** (trait épais semi-transparent, zone large)
- Bouton **Effacer** (apparaît quand traits présents)
- Canvas SVG full-screen avec dessin UI-thread (Reanimated worklet)
- Zoom désactivé pendant le dessin (`enabled={!tool}`)
- Le nombre de zones dessinées est passé dans le prompt Grok-3
- Fix KAV + zIndex

### `app/tab/cheveux.tsx` — réécriture complète
**Avant :** Seulement bouton Attacher + input text, pas de base64

**Après :**
- Même outils Magic + Crayon + Attacher que style/inpaint
- `pickMainImage` séparé de `pickRef` (plus propre qu'un setter générique)
- `base64: true` ajouté sur le picker principal → image envoyée à Grok-3 vision
- `analyzeHairstyle` passe maintenant l'image + les zones dessinées au modèle
- Fix KAV + zIndex

---

## Architecture dessin (partagée entre les 3 écrans)

```
Gesture.Pan (worklet UI thread)
  → onStart : init livePath shared value
  → onUpdate : append L points (seuil 3px anti-tremblement)
  → onEnd : runOnJS(commitPath) → pousse le trait dans strokes[]

SVG overlay :
  - strokes[] : traits validés (brush = semi-transparent épais, magic = blanc fin + glow orange)
  - AnimatedPath : trait live (0 latence, UI thread)

drawGesture.enabled = (tool === "magic" || tool === "brush")
ZoomableView.enabled = (!tool)
```

---

## Bug : écran noir après upload image

### Symptôme
Après sélection d'une image dans le picker, l'écran reste noir.
L'image et les boutons n'apparaissent qu'après une interaction externe
(ex: ouvrir le modal diamants).

### Cause racine
`renderScene` dans `home_map.tsx` est un `useCallback([sceneMap, routes, index])`.
Quand le picker natif (Android Activity) se ferme et retourne à l'app,
`react-native-tab-view` peut appeler une version stale de `renderScene`
où `index` est incorrect → `routes[index].key === route.key` = `false`
même sur le tab actif → `TabFocusContext` fournit `focused = false`.

`useImageFade(uri, focused)` déclenchait `Animated.timing(opacity, { toValue: 0 })`
car `focused = false` → image noire.
Le re-render déclenché par toute interaction dans HomeMap (ex: modal diamants)
corrigeait le `focused` → image réapparaissait.

### Fix appliqué — `hooks/useImageFade.ts`
Suppression de la dépendance à `focused` dans le hook.
L'image fade-in dès que `uri` est défini, reset à 0 quand `uri` est null.
TabView cache déjà visuellement les tabs inactifs, donc l'ancien comportement
"fade-out on unfocus" n'apportait rien fonctionnellement.

```ts
// Avant
useEffect(() => {
  if (uri && focused) { /* fade in */ } else { /* fade out to 0 */ }
}, [uri, focused]);

// Après
useEffect(() => {
  if (uri) { opacity.setValue(0); Animated.timing(opacity, { toValue: 1 }).start(); }
  else { opacity.setValue(0); }
}, [uri]);  // focused retiré des deps
```

---

## Note runOnJS deprecated
`runOnJS` est marqué deprecated dans Reanimated 4.3.1 (hint TS, non-bloquant).
Le remplacement officiel est `Worklets.createRunOnJS`, mais l'API est en flux.
À migrer quand la doc Reanimated 4 sera stabilisée. Ne pas migrer maintenant.

---

## Dépendances clés (Expo 56)
| Package | Version | Notes |
|---------|---------|-------|
| expo | ^56.0.12 | new arch activée |
| react-native | 0.85.3 | Fabric default |
| react-native-gesture-handler | ~2.31.1 | v2, GestureDetector |
| react-native-reanimated | 4.3.1 | worklets UI thread |
| react-native-svg | 15.15.4 | AnimatedPath |
| expo-image-picker | ~56.0.18 | `mediaTypes: ["images"]` (pas MediaTypeOptions) |
| expo-file-system | ~56.0.8 | import `/legacy` nécessaire |
| expo-media-library | ~56.0.7 | import `/legacy` nécessaire |
