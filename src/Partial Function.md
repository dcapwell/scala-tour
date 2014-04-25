# Partial Function
A function takes a `A` and returns a `B`; a proper function must handle all cases of `A`.  What about the cases where we can't handle all cases of `A`?  This is where partial functions come in.

```scala
val one: PartialFunction[Int, String] = { case 1 => "one" }

one.isDefinedAt(1)
// true
one.isDefinedAt(10)
// false

one(1)
// one
one(10)
// MatchError: 10 (of class java.lang.Integer)
```

Partial functions can be composed together in a similar way to how functions compose.

```scala
val one: PartialFunction[Int, String] = { case 1 => "one" }
val two: PartialFunction[Int, String] = { case 2 => "two" }
val three: PartialFunction[Int, String] = { case 3 => "three" }
val wildcard: PartialFunction[Int, String] = { case _ => "something else" }

val allCases = one orElse two orElse three orElse wildcard

allCases(100)
// something else
allCases(3)
// three
```

When would this be useful?  If you look at several REST frameworks, they work off this idea; `PartialFunction[Request, Response]`
