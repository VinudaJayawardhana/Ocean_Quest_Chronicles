SHARK SPRITES v2 (2D game)
Frame size: 300x200 (PNGs are 600x400 @2x), transparent background.
Sheet order (left to right): swim_1, swim_2, swim_3, swim_4, bite, defeated
shark_spritesheet_left.png  = shark faces LEFT; shark_spritesheet_right.png = faces RIGHT
(Sheet PNG is 3600x400; show it at 1800x200 so each frame is 300x200.)

CSS swim animation:
.shark{width:300px;height:200px;background:url(shark_spritesheet_left.png) 0 0/1800px 200px;animation:swim .6s steps(4) infinite}
@keyframes swim{to{background-position:-1200px 0}}
.shark.bite{animation:none;background-position:-1200px 0}
.shark.defeated{animation:none;background-position:-1500px 0}
