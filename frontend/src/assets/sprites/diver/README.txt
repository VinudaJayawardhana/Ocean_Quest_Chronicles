DIVER SPRITES (2D game) - the PLAYER (yellow brass helmet, like the logo)
Frame size: 300x240 (PNGs are 600x480 @2x), transparent background.
Frame order (left to right in the sheets):
 1-4  swim_1..swim_4  (moving / swimming loop)
 5    scared          (sees the shark or pirate appear)
 6    hurt            (got attacked)
 7    celebrate       (answered correctly, escaped)
 8    defeated        (lost all lives)
diver_spritesheet_right.png = diver faces RIGHT (default); _left = faces LEFT
Sheet PNG is 4800x480; show it at 2400x240 so each frame is 300x240.

CSS example (swim loop):
.diver{width:300px;height:240px;background:url(diver_spritesheet_right.png) 0 0/2400px 240px;animation:swim .6s steps(4) infinite}
@keyframes swim{to{background-position:-1200px 0}}
