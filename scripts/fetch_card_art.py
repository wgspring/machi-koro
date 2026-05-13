"""下载 19 张 AI 生成的卡片背景到 src/assets/cardbg/{buildings,landmarks}/，并清理旧 SVG。"""
import os
import urllib.request
import pathlib

BASE = pathlib.Path('/Users/wangguichun/Documents/Code/machi-koro/src/assets/cardbg')
B = BASE / 'buildings'
L = BASE / 'landmarks'

# id -> URL（按生成顺序对应）
buildings = {
    'wheat_field':    'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/9d40f1e7ff7e42ec80235fbc6c390c0d.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=IZFI8HtPKkyTsQm330TDWpTT5rI%3D',
    'ranch':          'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/48a04be5d82c4372acc1e6fb7799c8d2.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=5qzL2K8coVIFP7l4rGjYEaIv0pU%3D',
    'forest':         'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/55b3fa3f9eb049339ee3de7727f1c4a7.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=mhBAi%2FfOS0srp6o9%2BP2gMallU5s%3D',
    'mine':           'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/b7f2afb30f60453388688e076d0958d0.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=tIRbMJiH9wnPWuDJOzJH2L%2Bq%2BSc%3D',
    'apple_orchard':  'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/ad69a313a94e429bbaa9d3516a66614a.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=icnks4ajNNEEm6X7aw9PgzjNKMA%3D',
    'bakery':         'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/39e1f9f6ab1f4c4c9bbe6b2f6dd87e38.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=fF3g42e%2BbLe7D5xrlIOGPSpLc3s%3D',
    'convenience':    'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/77a4227400d942b38a3d30f60b482b06.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=K68QCw6FfpBI6KqWT%2FZ5fCdKRS8%3D',
    'cheese_factory': 'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/8c7858a1f1cc40d19449922f92554123.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=2v89yQzkPVOhigQxN81XGmH3l8w%3D',
    'furniture':      'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/7728a59a27844c0f9b9a499927edb60c.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=NGzGcHsMZuwZa31EaJOXSgjoxH4%3D',
    'market':         'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/7c05f11c0ef94c5792c7cd287e4af99f.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=F3L%2BHx1pMSDg%2FkNyoNU0bkxMegk%3D',
    'cafe':           'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/4216155a3c704d5083d5e974c8e636f9.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=YbuWCwAdpD9R6r89PuZS8w7zR4g%3D',
    'restaurant':     'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/a1743c4307564d8f8f4b47ced82b120c.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=z25BL2KicxRHogo8wAkz0ZON2w8%3D',
    'stadium':        'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/1788b224648f4185beccda7d75121c01.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=er3lxVDLY%2F7vUavrc7lby49W%2Ftk%3D',
    'tv_station':     'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/a173435f916c484384e87b4ab9c63a69.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=vgoRvE9hSE%2FnUZeWqwMKPRb06xA%3D',
    'business_ctr':   'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/549e296065b34e2c82d1c96dd0742118.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=GD0kgV1W%2F9Soz9txjjqEUhMjS5M%3D',
}

landmarks = {
    'station':     'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/f4df4780b8f4405db8bec065e2d23360.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=RV0T2RSiCQjJBohynGdOt80L%2FwM%3D',
    'mall':        'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/78d9b002fa8e4bc1b5b8891492baa74a.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=ZjXu4yJ6DMsWOzl5aBsBxXS4xu0%3D',
    'amusement':   'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/1ae8af759d5f4dd3ada6b52dc30be782.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=CEBIKr%2FFsgbgtUjGqoLWHwPNYrY%3D',
    'radio_tower': 'https://p-mira-img-sign-sgnontt.byteintl.net/tos-mya-i-xobrcjvdq7/8db542f42ce3494c8a1aa42fba8a4397.jpeg~tplv-xobrcjvdq7-image-jpeg.jpeg?lk3s=3523e930&x-orig-authkey=miraorigin&x-orig-expires=1810213200&x-orig-sign=SHSdlRSyB5LAp0L58MpmkyUN60A%3D',
}

# 删除旧 SVG
for d in (B, L):
    for f in d.glob('*.svg'):
        f.unlink()
        print('removed', f.name)

def fetch(url, dst):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r, open(dst, 'wb') as fp:
        fp.write(r.read())

for name, url in buildings.items():
    fetch(url, B / f'{name}.png')
    print('saved building', name)
for name, url in landmarks.items():
    fetch(url, L / f'{name}.png')
    print('saved landmark', name)

print('done. files:')
for d in (B, L):
    print(d.name, sorted(os.listdir(d)))
