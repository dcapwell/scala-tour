# F-Bounded Type
F-Bounded types are types that point to the objects type.  What does this mean really?

```scala
trait Foo[T <: Foo[T]] {
    def self: T
}
```

This weird syntax `T <: Foo[T]` is saying that the type of `Foo[T]` must be something that is itself a `Foo[T]` (the lower bound of `T` must at least be `Foo[T]`).

```scala
scala> case class Bar extends Foo[Bar] {
    def self = this
}
defined class Bar

scala> val b1 = Bar()
b1: Bar = Bar()

scala> val b2 = b1.self
b2: Bar = Bar()
```

Why would we care about this?  Turns out that this type is nice when extending traits and working with methods that return the type of the object implementing them and not a base type defined lower down in the type hierarchy.  Lets look at a collection example.

```scala
trait Iterable[T <: Iterable[T]] {
    def map(f: Int => Int): T
}

trait List extends Iterable[List] {
    def map(f: Int => Int): List
}

trait Vector extends Iterable[Vector] {
    def map(f: Int => Int): Vector
}
```

In this case both `List` and `Vector` are `Iterable`, but when you work with methods from the `Iterable` trait, you always get back the type that you were working with: `List` returns `List`, `Vector` returns `Vector`.

F-Bounded types are nice since they let you define the type at the implementation level and not at the base trait level.  That way all implementations of a trait only have to care about objects of their own type.  A better example can be found in the chapter on [Type Classes](Type Classes.html): type safe comparable.
