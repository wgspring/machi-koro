"""一次性生成所有卡牌专属插画背景 SVG (200x120, 简笔风格, 半透明友好)."""
import os, pathlib

BASE = pathlib.Path('/Users/wangguichun/Documents/Code/machi-koro/src/assets/cardbg')
B = BASE / 'buildings'
L = BASE / 'landmarks'
B.mkdir(parents=True, exist_ok=True)
L.mkdir(parents=True, exist_ok=True)

# 通用渐变背景片段 (color stops 由调用方传入)
def grad(top, bot, gid='bg'):
    return f'''<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="{top}"/><stop offset="100%" stop-color="{bot}"/>
      </linearGradient></defs>
      <rect width="200" height="120" fill="url(#{gid})"/>'''

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">{body}</svg>\n'

# ============ 蓝色:初级产业 ============
# 麦田 wheat_field
wheat = grad('#cfe3ff', '#eaf3ff') + '''
  <rect x="0" y="80" width="200" height="40" fill="#e9c45a" opacity=".55"/>
  <g stroke="#b2802a" stroke-width="1.4" opacity=".7">
    <line x1="20" y1="115" x2="20" y2="92"/><line x1="40" y1="118" x2="40" y2="90"/>
    <line x1="60" y1="116" x2="60" y2="88"/><line x1="80" y1="118" x2="80" y2="92"/>
    <line x1="100" y1="115" x2="100" y2="86"/><line x1="120" y1="118" x2="120" y2="90"/>
    <line x1="140" y1="115" x2="140" y2="88"/><line x1="160" y1="118" x2="160" y2="92"/>
    <line x1="180" y1="115" x2="180" y2="86"/>
  </g>
  <g fill="#d29a3a" opacity=".75">
    <ellipse cx="20" cy="86" rx="3" ry="5"/><ellipse cx="40" cy="84" rx="3" ry="5"/>
    <ellipse cx="60" cy="82" rx="3" ry="5"/><ellipse cx="80" cy="86" rx="3" ry="5"/>
    <ellipse cx="100" cy="80" rx="3" ry="5"/><ellipse cx="120" cy="84" rx="3" ry="5"/>
    <ellipse cx="140" cy="82" rx="3" ry="5"/><ellipse cx="160" cy="86" rx="3" ry="5"/>
    <ellipse cx="180" cy="80" rx="3" ry="5"/>
  </g>
  <circle cx="170" cy="28" r="13" fill="#ffd773" opacity=".85"/>
'''

# 牧场 ranch
ranch = grad('#cfe3ff', '#eaf3ff') + '''
  <rect x="0" y="85" width="200" height="35" fill="#a8d5a4" opacity=".75"/>
  <!-- 栅栏 -->
  <g stroke="#9a6a3c" stroke-width="1.5" opacity=".75">
    <line x1="0" y1="90" x2="200" y2="90"/>
    <line x1="0" y1="100" x2="200" y2="100"/>
    <line x1="20" y1="84" x2="20" y2="110"/>
    <line x1="60" y1="84" x2="60" y2="110"/>
    <line x1="100" y1="84" x2="100" y2="110"/>
    <line x1="140" y1="84" x2="140" y2="110"/>
    <line x1="180" y1="84" x2="180" y2="110"/>
  </g>
  <!-- 奶牛 -->
  <g opacity=".85">
    <ellipse cx="80" cy="78" rx="18" ry="9" fill="#fff" stroke="#333" stroke-width="1"/>
    <circle cx="64" cy="74" r="6" fill="#fff" stroke="#333" stroke-width="1"/>
    <ellipse cx="86" cy="76" rx="3" ry="2" fill="#3a3a3a"/>
    <ellipse cx="74" cy="80" rx="3" ry="2" fill="#3a3a3a"/>
    <line x1="68" y1="86" x2="68" y2="92" stroke="#333" stroke-width="1.2"/>
    <line x1="92" y1="86" x2="92" y2="92" stroke="#333" stroke-width="1.2"/>
    <ellipse cx="135" cy="80" rx="14" ry="7" fill="#fff" stroke="#333" stroke-width="1"/>
    <circle cx="123" cy="77" r="5" fill="#fff" stroke="#333" stroke-width="1"/>
  </g>
'''

# 森林 forest
forest = grad('#cfe3ff', '#eaf3ff') + '''
  <rect x="0" y="92" width="200" height="28" fill="#9bbf86" opacity=".7"/>
  <g opacity=".8">
    <polygon points="22,90 38,40 54,90" fill="#3f7a4b"/>
    <rect x="34" y="86" width="8" height="14" fill="#7a4a2a"/>
    <polygon points="68,90 88,30 108,90" fill="#2f6a3d"/>
    <rect x="84" y="86" width="8" height="14" fill="#7a4a2a"/>
    <polygon points="120,90 140,50 160,90" fill="#3f7a4b"/>
    <rect x="136" y="86" width="8" height="14" fill="#7a4a2a"/>
    <polygon points="170,92 184,60 198,92" fill="#2f6a3d"/>
    <rect x="180" y="88" width="8" height="14" fill="#7a4a2a"/>
  </g>
'''

# 矿山 mine
mine = grad('#cfe3ff', '#eaf3ff') + '''
  <!-- 山体 -->
  <polygon points="0,110 60,30 100,90 150,40 200,110" fill="#7a8da3" opacity=".75"/>
  <polygon points="50,55 70,30 92,55" fill="#6a7c92" opacity=".85"/>
  <!-- 矿洞 -->
  <ellipse cx="80" cy="92" rx="10" ry="8" fill="#2c3340" opacity=".85"/>
  <!-- 镐 -->
  <g stroke="#7a4a2a" stroke-width="3" stroke-linecap="round" opacity=".9">
    <line x1="135" y1="90" x2="160" y2="65"/>
  </g>
  <line x1="155" y1="60" x2="175" y2="58" stroke="#666" stroke-width="3" opacity=".9"/>
  <line x1="155" y1="60" x2="170" y2="48" stroke="#666" stroke-width="3" opacity=".9"/>
'''

# 苹果园 apple_orchard
apple = grad('#cfe3ff', '#eaf3ff') + '''
  <rect x="0" y="92" width="200" height="28" fill="#a8d5a4" opacity=".7"/>
  <g opacity=".85">
    <rect x="44" y="68" width="6" height="32" fill="#7a4a2a"/>
    <circle cx="47" cy="60" r="22" fill="#3f7a4b"/>
    <circle cx="40" cy="55" r="3" fill="#e85b4a"/>
    <circle cx="55" cy="58" r="3" fill="#e85b4a"/>
    <circle cx="48" cy="68" r="3" fill="#e85b4a"/>

    <rect x="146" y="70" width="6" height="30" fill="#7a4a2a"/>
    <circle cx="149" cy="62" r="20" fill="#2f6a3d"/>
    <circle cx="142" cy="58" r="3" fill="#e85b4a"/>
    <circle cx="156" cy="60" r="3" fill="#e85b4a"/>
    <circle cx="150" cy="70" r="3" fill="#e85b4a"/>
  </g>
'''

# ============ 绿色:商业设施 ============
# 面包店
bakery = grad('#dff5e6', '#f0faf3') + '''
  <rect x="0" y="92" width="200" height="28" fill="#d6c79a" opacity=".55"/>
  <g opacity=".85">
    <rect x="35" y="50" width="130" height="50" fill="#f4d4a3"/>
    <polygon points="35,50 100,28 165,50" fill="#a85b4f"/>
    <rect x="80" y="68" width="40" height="32" fill="#c98671"/>
    <rect x="86" y="74" width="28" height="22" fill="#7d4f2a"/>
    <!-- 牛角包 -->
    <path d="M50,82 q6,-10 16,-6 q-2,8 -16,6Z" fill="#e0a05a"/>
    <ellipse cx="148" cy="80" rx="8" ry="5" fill="#e0a05a"/>
  </g>
'''

# 便利店
conv = grad('#dff5e6', '#f0faf3') + '''
  <rect x="0" y="92" width="200" height="28" fill="#cfd5e0" opacity=".6"/>
  <g opacity=".85">
    <rect x="30" y="48" width="140" height="52" fill="#fff2c2"/>
    <rect x="30" y="48" width="140" height="10" fill="#e85b4a"/>
    <rect x="36" y="64" width="40" height="22" fill="#bce3ff"/>
    <rect x="84" y="64" width="40" height="22" fill="#bce3ff"/>
    <rect x="132" y="64" width="32" height="36" fill="#7d4f2a"/>
    <rect x="136" y="68" width="22" height="28" fill="#c98671"/>
    <line x1="36" y1="70" x2="76" y2="70" stroke="#7a8da3"/>
    <line x1="84" y1="70" x2="124" y2="70" stroke="#7a8da3"/>
  </g>
'''

# 起司工厂 cheese_factory
cheese = grad('#dff5e6', '#f0faf3') + '''
  <rect x="0" y="92" width="200" height="28" fill="#d6c79a" opacity=".55"/>
  <g opacity=".9">
    <polygon points="60,90 100,40 140,90" fill="#ffd24a"/>
    <circle cx="85" cy="72" r="3" fill="#fff" opacity=".8"/>
    <circle cx="100" cy="62" r="3" fill="#fff" opacity=".8"/>
    <circle cx="115" cy="76" r="3" fill="#fff" opacity=".8"/>
    <circle cx="120" cy="80" r="2" fill="#fff" opacity=".8"/>
    <line x1="100" y1="40" x2="100" y2="90" stroke="#caa128" stroke-width="1"/>
  </g>
  <!-- 烟囱 -->
  <g opacity=".7" fill="#aaa">
    <rect x="20" y="62" width="10" height="30"/>
    <rect x="170" y="62" width="10" height="30"/>
  </g>
'''

# 家具工厂 furniture
furn = grad('#dff5e6', '#f0faf3') + '''
  <rect x="0" y="92" width="200" height="28" fill="#d6c79a" opacity=".55"/>
  <g opacity=".85">
    <!-- 椅子 -->
    <rect x="40" y="60" width="36" height="6" fill="#a85b4f"/>
    <rect x="42" y="66" width="32" height="6" fill="#7a4a2a"/>
    <rect x="44" y="72" width="4" height="20" fill="#7a4a2a"/>
    <rect x="68" y="72" width="4" height="20" fill="#7a4a2a"/>
    <rect x="40" y="40" width="6" height="20" fill="#a85b4f"/>
    <rect x="70" y="40" width="6" height="20" fill="#a85b4f"/>
    <!-- 桌子 -->
    <rect x="115" y="58" width="60" height="6" fill="#a85b4f"/>
    <rect x="120" y="64" width="4" height="28" fill="#7a4a2a"/>
    <rect x="166" y="64" width="4" height="28" fill="#7a4a2a"/>
  </g>
'''

# 蔬果市场 market
mk = grad('#dff5e6', '#f0faf3') + '''
  <rect x="0" y="92" width="200" height="28" fill="#cfd5e0" opacity=".55"/>
  <g opacity=".85">
    <!-- 顶棚 -->
    <rect x="20" y="40" width="160" height="12" fill="#e85b4a"/>
    <line x1="40" y1="52" x2="40" y2="36" stroke="#7a4a2a"/>
    <line x1="100" y1="52" x2="100" y2="36" stroke="#7a4a2a"/>
    <line x1="160" y1="52" x2="160" y2="36" stroke="#7a4a2a"/>
    <!-- 摊位 -->
    <rect x="30" y="72" width="140" height="22" fill="#f4d4a3"/>
    <!-- 苹果/番茄/橙 -->
    <circle cx="55" cy="68" r="6" fill="#e85b4a"/>
    <circle cx="75" cy="68" r="6" fill="#ffb84a"/>
    <circle cx="95" cy="68" r="6" fill="#5e8b56"/>
    <circle cx="115" cy="68" r="6" fill="#e85b4a"/>
    <circle cx="135" cy="68" r="6" fill="#ffd24a"/>
    <circle cx="155" cy="68" r="6" fill="#7a4a8a"/>
  </g>
'''

# ============ 红色:餐饮业 ============
# 咖啡馆 cafe
cafe = grad('#fde0d8', '#fff2ee') + '''
  <rect x="0" y="92" width="200" height="28" fill="#c98671" opacity=".55"/>
  <g opacity=".9">
    <!-- 咖啡杯 -->
    <ellipse cx="80" cy="70" rx="28" ry="8" fill="#fff" stroke="#7a4a2a"/>
    <path d="M52,70 q0,30 28,30 q28,0 28,-30" fill="#fff" stroke="#7a4a2a" stroke-width="1.5"/>
    <ellipse cx="80" cy="70" rx="22" ry="6" fill="#7a4a2a"/>
    <path d="M108,76 q14,0 14,12 q0,12 -14,10" fill="none" stroke="#7a4a2a" stroke-width="2"/>
    <!-- 蒸汽 -->
    <path d="M68,40 q4,-8 0,-16 M80,40 q4,-8 0,-16 M92,40 q4,-8 0,-16" fill="none" stroke="#aaa" stroke-width="1.2" opacity=".7"/>
  </g>
'''

# 家庭餐厅 restaurant
rest = grad('#fde0d8', '#fff2ee') + '''
  <rect x="0" y="92" width="200" height="28" fill="#c98671" opacity=".55"/>
  <g opacity=".9">
    <!-- 大盘 -->
    <ellipse cx="100" cy="80" rx="44" ry="12" fill="#fff" stroke="#c98671" stroke-width="2"/>
    <!-- 食物 -->
    <circle cx="88" cy="76" r="8" fill="#ffb84a"/>
    <ellipse cx="108" cy="76" rx="12" ry="6" fill="#5e8b56"/>
    <circle cx="120" cy="74" r="4" fill="#e85b4a"/>
    <!-- 刀叉 -->
    <line x1="40" y1="50" x2="46" y2="92" stroke="#888" stroke-width="3"/>
    <line x1="160" y1="50" x2="154" y2="92" stroke="#888" stroke-width="3"/>
  </g>
'''

# ============ 紫色:大型设施 ============
# 体育馆 stadium
stadium = grad('#e8dcfb', '#f3edff') + '''
  <ellipse cx="100" cy="100" rx="90" ry="20" fill="#5e8b56" opacity=".6"/>
  <ellipse cx="100" cy="98" rx="80" ry="14" fill="#7aa84a" opacity=".7"/>
  <g opacity=".9">
    <!-- 看台 -->
    <path d="M20,80 Q100,40 180,80" fill="#7c5dc8"/>
    <path d="M20,80 Q100,50 180,80" fill="#9a82d8"/>
    <!-- 灯柱 -->
    <line x1="40" y1="50" x2="40" y2="20" stroke="#666" stroke-width="2"/>
    <rect x="34" y="14" width="14" height="8" fill="#fff5d2"/>
    <line x1="160" y1="50" x2="160" y2="20" stroke="#666" stroke-width="2"/>
    <rect x="154" y="14" width="14" height="8" fill="#fff5d2"/>
  </g>
'''

# 电视台 tv_station
tv = grad('#e8dcfb', '#f3edff') + '''
  <rect x="0" y="92" width="200" height="28" fill="#9a82d8" opacity=".55"/>
  <g opacity=".9">
    <!-- 电视机 -->
    <rect x="50" y="35" width="100" height="60" rx="6" fill="#3a3a3a"/>
    <rect x="56" y="42" width="88" height="46" fill="#bce3ff"/>
    <!-- 信号 -->
    <path d="M100,42 L92,30 M100,42 L108,30 M100,42 L96,24 M100,42 L104,24" stroke="#ffd24a" stroke-width="2"/>
    <!-- 旋钮 -->
    <circle cx="100" cy="92" r="3" fill="#aaa"/>
  </g>
'''

# 商业中心 business_ctr
biz = grad('#e8dcfb', '#f3edff') + '''
  <rect x="0" y="100" width="200" height="20" fill="#9a82d8" opacity=".55"/>
  <g opacity=".9">
    <rect x="60" y="20" width="80" height="80" fill="#5e3fab"/>
    <rect x="64" y="24" width="72" height="76" fill="#7c5dc8"/>
    <g fill="#ffe27a">
      <rect x="70" y="32" width="8" height="8"/>
      <rect x="86" y="32" width="8" height="8"/>
      <rect x="102" y="32" width="8" height="8"/>
      <rect x="118" y="32" width="8" height="8"/>
      <rect x="70" y="48" width="8" height="8"/>
      <rect x="102" y="48" width="8" height="8"/>
      <rect x="118" y="48" width="8" height="8"/>
      <rect x="86" y="64" width="8" height="8"/>
      <rect x="102" y="64" width="8" height="8"/>
      <rect x="70" y="80" width="8" height="8"/>
      <rect x="118" y="80" width="8" height="8"/>
    </g>
    <rect x="94" y="80" width="12" height="20" fill="#3a3a3a"/>
  </g>
'''

# ============ 地标 ============
# 火车站
station = grad('#fff5d2', '#fffbed') + '''
  <rect x="0" y="100" width="200" height="20" fill="#aaa" opacity=".55"/>
  <g opacity=".9">
    <rect x="20" y="50" width="160" height="50" fill="#c98671"/>
    <polygon points="20,50 100,28 180,50" fill="#7a4a2a"/>
    <rect x="50" y="62" width="22" height="38" fill="#7d4f2a"/>
    <rect x="86" y="62" width="22" height="22" fill="#bce3ff"/>
    <rect x="124" y="62" width="22" height="38" fill="#7d4f2a"/>
    <circle cx="100" cy="40" r="5" fill="#fff5d2" stroke="#7a4a2a"/>
    <line x1="100" y1="36" x2="100" y2="44" stroke="#7a4a2a"/>
    <line x1="96" y1="40" x2="104" y2="40" stroke="#7a4a2a"/>
  </g>
'''

# 购物中心
mall = grad('#fff5d2', '#fffbed') + '''
  <rect x="0" y="100" width="200" height="20" fill="#aaa" opacity=".55"/>
  <g opacity=".9">
    <rect x="20" y="36" width="160" height="68" fill="#e85b4a"/>
    <rect x="20" y="36" width="160" height="14" fill="#a85b4f"/>
    <g fill="#bce3ff">
      <rect x="30" y="58" width="30" height="20"/>
      <rect x="70" y="58" width="30" height="20"/>
      <rect x="110" y="58" width="30" height="20"/>
      <rect x="150" y="58" width="22" height="20"/>
    </g>
    <rect x="90" y="80" width="22" height="24" fill="#7d4f2a"/>
    <text x="100" y="46" font-size="10" text-anchor="middle" fill="#fff5d2" font-family="Arial" font-weight="bold">MALL</text>
  </g>
'''

# 游乐园(摩天轮)
amusement = grad('#fff5d2', '#fffbed') + '''
  <rect x="0" y="100" width="200" height="20" fill="#5e8b56" opacity=".55"/>
  <g opacity=".9" fill="none" stroke="#5e3fab" stroke-width="2">
    <circle cx="100" cy="60" r="40"/>
    <line x1="60" y1="60" x2="140" y2="60"/>
    <line x1="100" y1="20" x2="100" y2="100"/>
    <line x1="72" y1="32" x2="128" y2="88"/>
    <line x1="128" y1="32" x2="72" y2="88"/>
  </g>
  <g opacity=".95">
    <circle cx="100" cy="20" r="5" fill="#e85b4a"/>
    <circle cx="100" cy="100" r="5" fill="#ffd24a"/>
    <circle cx="60" cy="60" r="5" fill="#5e8b56"/>
    <circle cx="140" cy="60" r="5" fill="#5e3fab"/>
    <circle cx="72" cy="32" r="4" fill="#e85b4a"/>
    <circle cx="128" cy="32" r="4" fill="#ffd24a"/>
    <circle cx="72" cy="88" r="4" fill="#5e8b56"/>
    <circle cx="128" cy="88" r="4" fill="#5e3fab"/>
  </g>
  <line x1="100" y1="100" x2="86" y2="115" stroke="#7a4a2a" stroke-width="2"/>
  <line x1="100" y1="100" x2="114" y2="115" stroke="#7a4a2a" stroke-width="2"/>
'''

# 电波塔 radio_tower
radio = grad('#fff5d2', '#fffbed') + '''
  <rect x="0" y="100" width="200" height="20" fill="#aaa" opacity=".55"/>
  <g opacity=".9" stroke="#5e3fab" stroke-width="2" fill="none">
    <line x1="80" y1="100" x2="100" y2="20"/>
    <line x1="120" y1="100" x2="100" y2="20"/>
    <line x1="86" y1="76" x2="114" y2="76"/>
    <line x1="90" y1="60" x2="110" y2="60"/>
    <line x1="94" y1="44" x2="106" y2="44"/>
  </g>
  <circle cx="100" cy="20" r="4" fill="#e85b4a"/>
  <!-- 电波 -->
  <g fill="none" stroke="#5e3fab" stroke-width="1.5" opacity=".7">
    <path d="M70,30 q-10,10 0,20"/>
    <path d="M62,22 q-18,18 0,36"/>
    <path d="M130,30 q10,10 0,20"/>
    <path d="M138,22 q18,18 0,36"/>
  </g>
'''

building_files = {
    'wheat_field': wheat, 'ranch': ranch, 'forest': forest, 'mine': mine, 'apple_orchard': apple,
    'bakery': bakery, 'convenience': conv, 'cheese_factory': cheese, 'furniture': furn, 'market': mk,
    'cafe': cafe, 'restaurant': rest,
    'stadium': stadium, 'tv_station': tv, 'business_ctr': biz,
}
landmark_files = {
    'station': station, 'mall': mall, 'amusement': amusement, 'radio_tower': radio,
}

for name, body in building_files.items():
    (B / f'{name}.svg').write_text(svg(body))
for name, body in landmark_files.items():
    (L / f'{name}.svg').write_text(svg(body))

print(f'Wrote {len(building_files)} building + {len(landmark_files)} landmark SVGs')
print(sorted(os.listdir(B)))
print(sorted(os.listdir(L)))
