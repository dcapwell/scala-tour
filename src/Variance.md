# Variance and Bounds

## Variance
When you have a type T and a type T' which extends that type, the question to ask is is Container[T'] considered a subclass of Container[T]?  Variance annotations lets you control when this is the case or not.

Scala notation

|                   | Meaning              | Scala notation |
| --                | --                             | --   |
| **covariant**     | C[T’] is a subclass of C[T]    | [+T] |
| **contravariant** | C[T] is a subclass of C[T’]    | [-T] |
| **invariant**     | C[T] and C[T’] are not related | [T]  |


Lets go into a example

```scala
class Covariant[+A]
val cv: Covariant[AnyRef] = new Covariant[String]
// val cv: Covariant[String] = new Covariant[AnyRef] // type mismatch

class Contravariant[-A]
val cv: Contravariant[String] = new Contravariant[AnyRef]
// val fail: Contravariant[AnyRef] = new Contravariant[String] // type mismatch
```

## Bounds
In java you had the ability to define `super` and/or `extends` to try to define what can be accepted.  Scala lets you do the same but with a different syntax:

Lower bound
```scala
A <: B
```

Upper bound
```scala
A >: B
```

Lets see an example

```scala
class Foo
class Bar extends Foo
class Baz extends Bar

trait Container[A]
// put lower bound of Foo
case class FooContainer[A <: Foo](foo: A) extends Container[A]
FooContainer(new Foo)
// FooContainer[Foo]
FooContainer(new Bar)
// FooContainer[Bar]
FooContainer(new Baz)
// FooContainer[Baz]
// FooContainer(1)
// compiler error

case class BarContainer(bar: Bar) extends Container[Bar]
BarContainer(new Bar)
// BarContainer
BarContainer(new Baz)
// BarContainer

// put a upper bound on Baz
case class BazContainer[A >: Baz](baz: A) extends Container[A]
BazContainer(new Baz)
// BazContainer[Baz]
BazContainer(new Foo)
// BazContainer[Foo]
BazContainer(1)
// BazContainer[Any]
```
