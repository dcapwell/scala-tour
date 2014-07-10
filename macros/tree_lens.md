# Tree Lens
It might be just me, but I find updating `Tree`s unpleasant.  The API for each type of `Tree` has a trait that defines how to interact with it, and a val "Extractor" that provides `apply` and `unapply`.

So when you have a deeply nested immutable structure, what do you do?  Throw a `Lens` at it!

I first looked at using shapeless for creating a lens for each part of the different trees (cause the macro auto gen), but found that this is not as nice since `Tree` is not a case class, and the API was a bit harder to build these trees by hand.  I then switched to scalaz's `Lens` since they are simple to build up and compose (and I auto depend on it for every project...).

```scala
val modFlags = Lens.lensu[Modifiers, FlagSet](
  set = (m, flags) => Modifiers(flags, m.privateWithin, m.annotations),
  get = (m) => m.flags
)

val valMods = Lens.lensu[ValDef, Modifiers](
  set = (v, m) => ValDef(m, v.name, v.tpt, v.rhs),
  get = (v) => v.mods
)

val valFlags: Lens[ValDef, FlagSet] = valMods andThen modFlags
```

Now that I have done that, I am able to update deep leafs very simply

```scala
clazzFlags.mod(_ | CASE, clazzBody.set(clazz, newBody ::: caseDefs))
```

I am adding more lenses as I need them, but for a set of pre-made lenses you can find them [in my playground](https://github.com/dcapwell/scala-playground/blob/38401439c850baacc3f41d6f13e4d3e2221050ba/macros/src/main/scala/com/github/dcapwell/scala/playground/macros/MacroSupport.scala#L6).
