function preloadTextures() {
  //Load all the textures
  for (let i = 0; i < texPaths.length; i++) {
    nde.tex[texPaths[i].path] = nde.loadImg("assets/textures/" + texPaths[i].path + ".png");
  }

  //Split all the spritemaps from files named for example "1,2,3,4" and makes "1", "2", "3", "4"
  for (textureName in nde.tex) {
    let s1 = textureName.split("/");
    let fileName = s1.splice(s1.length - 1, 1)[0];
    let pathName = s1.join("/");

    let s2 = fileName.split(",");
    if (s2.length <= 1) continue;

    for (let i = 0; i < s2.length; i++) {
      let newImg = new Img(new Vec(1, 1));
      newImg.loading = true;
      nde.tex[pathName + (pathName != "" ? "/" : "") + s2[i]] = newImg;
    }      

    let img = nde.tex[textureName];
    delete nde.tex[textureName];
      
    img.onload = () => {
      let size = new Vec(img.size.x / s2.length, img.size.y);
      
      for (let i = 0; i < s2.length; i++) {
        let newImg = nde.tex[pathName + (pathName != "" ? "/" : "") + s2[i]];
        newImg.resize(size);
        newImg.ctx.putImageData(img.ctx.getImageData(size.x * i, 0, size.x, size.y), 0, 0);
        
        newImg.loading = false;
      }    
    }
  }

  //Load all the audios
  for (let i = 0; i < audsPaths.length; i++) {
    let aud = new AudPool(nde.loadAud("assets/audios/" + audsPaths[i].path + ".mp3", {gain: audsPaths[i].gain}));
    nde.aud[audsPaths[i].path] = aud;
  }


  preloadAnimations();
}