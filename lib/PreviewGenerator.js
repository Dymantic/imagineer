function generatePreview(file, { pWidth = 300, pHeight = 300 } = {}) {
  function makeCanvas() {
    return document.createElement("canvas");
  }

  function getSourceDimensions(iWidth, iHeight, ratio) {
    const isLandscape = iWidth / iHeight > ratio;

    return {
      sWidth: isLandscape ? iHeight * ratio : iWidth,
      sHeight: isLandscape ? iHeight : iWidth / ratio,
      sX: isLandscape ? (iWidth - iHeight * ratio) / 2 : 0,
      sY: isLandscape ? 0 : (iHeight - iWidth / ratio) / 2
    };
  }

  function getPreviewSrc(image, sDimensions) {
    const dest_width = Math.min(pWidth, image.width);
    const dest_height = dest_width * (pHeight / pWidth);
    let canvas = makeCanvas();
    let ctx = canvas.getContext("2d");
    canvas.width = dest_width;
    canvas.height = dest_height;
    ctx.drawImage(
      image,
      sDimensions.sX,
      sDimensions.sY,
      sDimensions.sWidth,
      sDimensions.sHeight,
      0,
      0,
      dest_width,
      dest_height
    );
    return canvas.toDataURL();
  }

  function createPreview(image) {
    if (pWidth === "auto" || pHeight === "") {
      return image.src;
    }
    return getPreviewSrc(
      image,
      getSourceDimensions(image.width, image.height, pWidth / pHeight)
    );
  }

  let promise = new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    let preview = new Image();
    fileReader.onload = ev => {
      preview.src = ev.target.result;
      preview.onload = ev => resolve(createPreview(ev.target));
    };
    fileReader.onerror = err => reject(err);
    fileReader.readAsDataURL(file);
  });

  return promise;
}

export { generatePreview };
