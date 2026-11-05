OCTOPUS SPRITES (2D game) - aggressive giant octopus, same pack layout as the pirate
Frame size: 300x300 (PNGs are 600x600 @2x), transparent background.
Frame order (left to right in the sheets):
 1-4   swim_1..swim_4    (idle / swim loop)
 5-7   attack_1..attack_3 (tentacle windup, strike, ground slam)
 8     defeated
 9-11  guard_1..guard_3   (raise tentacles + shield bubble, full guard, guard pulse)
 12-14 collide_1..collide_3 (impact, knockback, dizzy recover)
octopus_spritesheet_left.png = octopus faces LEFT; _right = faces RIGHT
Sheet PNG is 8400x600; show it at 4200x300 so each frame is 300x300.

CSS example (swim loop):
.octopus{width:300px;height:300px;background:url(octopus_spritesheet_left.png) 0 0/4200px 300px;animation:swim .6s steps(4) infinite}
@keyframes swim{to{background-position:-1200px 0}}
Guard loop: frames 9-11 start at background-position -2400px. Collide: frames 12-14 start at -3300px.
