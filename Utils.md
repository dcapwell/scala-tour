# Utils
This section will go over useful functions of scalaz.  All examples need to import scalaz

```scala
import scalaz._, Scalaz._
```

## Option
In normal scala, you could use `Some(x)` or `Option(x)` as a way to create a `Option`, but some times it is cleaner if this could be chained

```scala
1.some
// creates Some(1)
none
// return None
```

now that we have an `Option`

```scala
1.some | 20 // getOrElse
// 1
none | 20
// 20

~ 10.some // getOrElse(Monoid[Int].zero)
// 10
~ none[Int]
// 0

1.some ? "found it" | "nope"
// found it

1.some err "won't get called"
// 1
none err "not defined"
// throws RuntimeException: not defined
```

## Booleans
Scalaz adds a few methods to booleans.

as `Option`

```scala
(1 < 10) option 1
// Some(1)
(1 > 10) option 1
// None
```

conditional branching

```scala
(1 < 10) when println("1 is less than 10")
// 1 is less than 10

(1 > 10) unless println("1 is less than 10")
// 1 is less than 10

(1 < 10) ? "less than 10" | "greater than 10"
// less than 10

(1 < 10) either "left" or "right"
// \/[String,String] = -\/(left)
// \/ is like Either in scala, but with a right bias (can use map/flatMap without projecting right)

(1 < 10) ?? 7
// 7
(1 > 10) ?? 7
// 0
```

## All Objects
Ever wanted to map over a object even if its not a functor?

```scala
20 |> {_ => "hi"}
// hi
1 + 2 + 3 |> {_.point[List]}
// List(6)
1 + 2 + 3 |> {_ * 6}
// 36

// if the partial function matches the element, then the function is applied
// if not, then Pointed[F].point(_) is used
42 visit { case x if x % 2 == 0 => List(x / 2) }
// List(21)
43 visit { case x if x % 2 == 0 => List(x / 2) }
// List(43)

// ranges on Enum type class
1 |-> 10
// List(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
```

## Java Interopt
When working with java libraries, you may sometimes get a null back.  You could always run everything within an if check, or just `??` it.

```scala
val javaVal: String = null
javaVal ?? "javaVal is a null!"
```
