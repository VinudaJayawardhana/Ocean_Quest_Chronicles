GUARD SPRITES (2D game) - 3 guards + mystery box, same pack layout as the pirate
Frame size: 300x300 (PNGs are 600x600 @2x), transparent background.
Frame order (left to right in the sheets):
 1-2   crab_guard_1..2      (claws up, claws blocking)
 3-4   crab_protect_1..2    (crab guarding the mystery box, then snapping)
 5-6   puffer_guard_1..2    (normal, inflated with spikes)
 7-8   puffer_protect_1..2  (inflated beside the box, then shocked/bigger)
 9-10  turtle_guard_1..2    (head out, tucked in shell with spikes)
 11-12 turtle_protect_1..2  (shell guarding the box, then shield bubble over both)
 13-15 box_1..box_3         (mystery box: idle, glow + sparkles, wiggle)
guard_spritesheet_left.png = guards face LEFT (box sits on the right); _right = face RIGHT
Sheet PNG is 9000x600; show it at 4500x300 so each frame is 300x300.

CSS example (crab protect loop, frames 3-4):
.g{width:300px;height:300px;background:url(guard_spritesheet_left.png) -600px 0/4500px 300px;animation:p .5s steps(2) infinite}
@keyframes p{to{background-position:-1200px 0}}
