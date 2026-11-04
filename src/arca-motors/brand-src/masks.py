import numpy as np
from PIL import Image
from scipy import ndimage as ndi
S=6
im=np.asarray(Image.open('src.png').convert('RGB')).astype(np.float32)
R,G,B=im[...,0],im[...,1],im[...,2]
mx=im.max(-1); mn=im.min(-1)
def up(a):  # float 0..1 field upscaled smoothly
    img=Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
    img=img.resize((img.width*S,img.height*S),Image.BICUBIC)
    f=np.asarray(img).astype(np.float32)/255
    return ndi.gaussian_filter(f,S*0.35)
def save(field,name,th=0.5,box=None):
    m=field>th
    if box:
        x0,y0,x1,y1=[v*S for v in box]; z=np.zeros_like(m); z[y0:y1,x0:x1]=m[y0:y1,x0:x1]; m=z
    Image.fromarray(np.where(m,0,255).astype(np.uint8)).save(name)
    print(name, m.sum())
# silver: brightness, low saturation
sil=np.clip((mx-25)/90,0,1)*(1-np.clip(((R-G)-40)/60,0,1))
save(up(sil),'m_arca.png',0.5,(40,412,312,486))
red=np.clip((R-G-35)/70,0,1)*np.clip((R-50)/80,0,1)
save(up(red),'m_motors.png',0.5,(312,412,715,486))
tag=np.clip((mx-60)/100,0,1)
save(up(tag),'m_tag.png',0.5,(200,515,560,540))
car=np.clip((mx-32)/70,0,1)
save(up(car),'m_car.png',0.45,(60,160,700,400))

save(up(sil),'m_A.png',0.5,(40,412,112,486))
