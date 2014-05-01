# Tag Types
In default scala, we have a way to alias types.

```scala
type Foo = String
```

This is great as a way to make code more readable, but if your type logically has a more limited range of support then the type won't enforce this.

```scala
type KiloGram = Int
def someWorkWithKiloGrams(value: KiloGram): KiloGram
someWorkWithKiloGrams(Integer.MIN_VALUE)
```

There is a way to `Tag` types.

```scala
import scalaz._, Scalaz._
sealed trait KiloGram
def KiloGram[A](a: A): A @@ KiloGram = Tag[A, KiloGram](a)

def someWorkWithKiloGram(value: Int @@ KiloGram): Int @@ KiloGram = KiloGram(value - 1)
// someWorkWithKiloGram(10) // won't compile
someWorkWithKiloGram(KiloGram(10)) // 9: Int @@ KiloGram
```

This is nice because now each method can choose what base types they can work with, and still require callers to `Tag` the type before calling as a way to enforce that the values make sense.  The same can be accomplished with type aliases, but you could never enforce that a user must do work to use the type.  With `Tag`, you now make the user do work to tag the type before calling, making it more explicit to the caller.

So how does this work?

```scala
type Tagged[T] = {type Tag = T}
type @@[+T, Tag] = T with Tagged[Tag]

object Tag {
    @inline def apply[A, T](a: A): A @@ T = a.asInstanceOf[A @@ T]
}
```

When working with a tagged type, it really is just a cast to another type.  The fact that its inlined is nice so all conversions to KiloGram are just a cast and nothing more.
