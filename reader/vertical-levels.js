// Injected into the original published module by build.mjs. K is that module's
// existing React JSX runtime; no second runtime, app shell or story is loaded.
function LinearReadingPanels({ block }) {
  const scenes = LINEAR_READING_SCENES[block.id];
  if (!scenes) throw new Error(`Missing reading scenes: ${block.id}`);
  function renderLayer(layer, key) {
    return K.jsx('img', {
      src: './' + layer.src.replace(/^\.?\//, ''), alt: '', loading: 'lazy', decoding: 'async', draggable: false,
      style: {
        left: `${layer.x || 0}%`, top: `${layer.y || 0}%`, width: `${layer.w ?? 100}%`,
        height: layer.h == null ? 'auto' : `${layer.h}%`,
        objectFit: layer.fit || (layer.kind === 'cover' ? 'cover' : 'contain'),
        clipPath: layer.clipPath, opacity: layer.opacity ?? 1,
        transform: `rotate(${layer.rotation || 0}deg) scaleX(${layer.flip ? -1 : 1})`,
      },
    }, key);
  }
  return K.jsxs('div', {
    className: 'linear-reading-panels',
    children: [
      K.jsx('h2', { className: 'linear-reading-title', children: block.title }),
      ...scenes.map((scene, index) => K.jsxs('figure', {
        className: 'linear-reading-panel',
        children: [
          K.jsx('div', {
            className: `linear-reading-scene${scene.frame ? ' linear-reading-framed' : ''}`,
            role: 'img',
            'aria-label': scene.alt,
            style: { aspectRatio: scene.frame ? 547 / 369 : scene.aspectRatio || 1.5 },
            children: K.jsxs('div', {
              className: 'linear-reading-viewport',
              children: [
                K.jsx('div', {
                  className: 'linear-reading-artwork',
                  children: [...scene.layers].sort((a, b) => (a.z || 0) - (b.z || 0)).map((layer, layerIndex) => renderLayer(layer, layer.key || `${index}-${layerIndex}`)),
                }),
                scene.frame ? renderLayer(scene.frame, 'frame') : null,
              ],
            }),
          }),
          K.jsx('figcaption', { children: scene.caption }),
        ],
      }, scene.id)),
    ],
  });
}
