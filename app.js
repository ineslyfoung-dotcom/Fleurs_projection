function sendDrawing() {

  const finalCanvas = document.createElement("canvas");
  const finalCtx = finalCanvas.getContext("2d");

  finalCanvas.width = drawCanvas.width;
  finalCanvas.height = drawCanvas.height;

  // fusion coloriage + fleur
  finalCtx.drawImage(drawCanvas, 0, 0);
  finalCtx.drawImage(lineCanvas, 0, 0);

  const imageData = finalCtx.getImageData(
    0,
    0,
    finalCanvas.width,
    finalCanvas.height
  );

  const lineData = lineCtx.getImageData(
    0,
    0,
    lineCanvas.width,
    lineCanvas.height
  );

  const data = imageData.data;
  const mask = lineData.data;

  const w = finalCanvas.width;
  const h = finalCanvas.height;

  const visited = new Uint8Array(w * h);
  const stack = [];

  function isBlackLine(i) {
    return (
      mask[i] < 80 &&
      mask[i+1] < 80 &&
      mask[i+2] < 80
    );
  }

  function push(x, y) {

    if (x < 0 || y < 0 || x >= w || y >= h) return;

    const index = y * w + x;

    if (visited[index]) return;

    const i = index * 4;

    if (isBlackLine(i)) return;

    visited[index] = 1;
    stack.push({x, y});
  }

  // départ bords
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }

  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  // flood fill extérieur
  while (stack.length > 0) {

    const {x, y} = stack.pop();
    const index = y * w + x;
    const i = index * 4;

    data[i+3] = 0;

    push(x+1, y);
    push(x-1, y);
    push(x, y+1);
    push(x, y-1);
  }

  finalCtx.putImageData(imageData, 0, 0);

  // masque final
  finalCtx.globalCompositeOperation = "destination-in";
  finalCtx.drawImage(lineCanvas, 0, 0);

  finalCtx.globalCompositeOperation = "source-over";
  finalCtx.drawImage(lineCanvas, 0, 0);

  const finalImage = finalCanvas.toDataURL("image/png");

  db.collection("flowers").add({
    image: finalImage,
    time: Date.now()
  })
  .then(() => {
    showNotif();
  })
  .catch((e) => {
    console.error(e);
    alert("Erreur Firestore");
  });

}