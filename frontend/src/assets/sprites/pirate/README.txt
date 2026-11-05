PIRATE SPRITES (2D game) - pirate with sword and hook hand
Frame size: 300x300 (PNGs are 600x600 @2x), transparent background.
Frame order (left to right in the sheets):
 1-4  swim_1..swim_4   (idle / swim loop)
 5-7  attack_1..attack_3 (sword windup, slash, follow-through)
 8    defeated
pirate_spritesheet_left.png = pirate faces LEFT; _right = faces RIGHT
Sheet PNG is 4800x600; show it at 2400x300 so each frame is 300x300.

CSS example (swim loop):
.pirate{width:300px;height:300px;background:url(pirate_spritesheet_left.png) 0 0/2400px 300px;animation:swim .6s steps(4) infinite}
@keyframes swim{to{background-position:-1200px 0}}
