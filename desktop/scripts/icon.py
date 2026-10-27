"""Create the original application icon using only the Python standard library."""
import binascii
import struct
import zlib
from pathlib import Path
out = Path(__file__).resolve().parents[1] / 'assets'
out.mkdir(exist_ok=True)
def pixels(n):
    rows=[]
    for y in range(n):
        row=[]
        for x in range(n):
            X,Y=(x+.5)*256/n,(y+.5)*256/n
            color=(37,61,84,255)
            if 36<=X<220 and 36<=Y<122:color=(169,204,236,255)
            if 108<=X<148 and 78<=Y<220:color=(147,206,76,255)
            if 69<=X<187 and 68<=Y<80:color=(207,108,203,255)
            row.append(color)
        rows.append(row)
    return rows
def png(n):
    def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',binascii.crc32(kind+data)&0xffffffff)
    raw=b''.join(b'\x00'+bytes(c for px in row for c in px) for row in pixels(n))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
def dib(n):
    bitmap=b''.join(bytes(c for px in row for c in (px[2],px[1],px[0],px[3])) for row in reversed(pixels(n)))
    mask=b'\0'*(((n+31)//32)*4*n)
    return struct.pack('<IiiHHIIiiII',40,n,n*2,1,32,0,len(bitmap),0,0,0,0)+bitmap+mask
sizes=[16,32,48,256];data=[dib(n) if n<256 else png(n) for n in sizes];offset=6+16*len(sizes);entries=[]
for n,blob in zip(sizes,data):
    entries.append(struct.pack('<BBBBHHII',n%256,n%256,0,0,1,32,len(blob),offset));offset+=len(blob)
(out/'icon.ico').write_bytes(struct.pack('<HHH',0,1,len(sizes))+b''.join(entries)+b''.join(data))
(out/'icon.png').write_bytes(png(256))
