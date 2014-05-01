# Partial Function
A function takes an `A` and returns a `B` for all `A`s.  But what if we are not able to handle all `A`s?  What if we want to build up to a proper function but in smaller building blocks?  This is where `PartialFunction` comes in, lets take a look.

```scala
val even: PartialFunction[Int, String] = { case e: Int if e % 2 == 0 => "even" }
```

Here we define a `PartialFunction` `even` that only works for ints that are even.  How would you use this?

```scala
even(2)
// even
even(1)
// scala.MatchError: 1 (of class java.lang.Integer)
```

Thats not nice!  `even(1)` throws an exception, thats so not scala style!  This is because `even` isn't a proper function, it only works with evens.  So lets check to see if our input is proper for this partial function.

```scala
even.isDefinedAt(2)
// true
even.isDefinedAt(1)
// false
```

When building apis that are given `PartialFunction`s, its your responsibility to make sure the given input is proper for the function.

```scala
def doWork[A, B](f: PartialFunction[A, B])(work: A): Option[B] =
        if(f.isDefinedAt(work)) Option(f(work)) else None

doWork(even)(1)
// None

doWork(even)(2)
// Some(even)
```

It was implied earlier that `PartialFunction`s are composable, lets show that.

```scala
val odd: PartialFunction[Int, String] = { case e: Int if e % 2 == 1 => "odd" }

val evenOrOdd = even orElse odd
```

if you have two `PartialFunction`s `A => B` and `B => C`, you can create a new one from `A => C`.

```scala
val length: PartialFunction[String, Int] = { case e: String => e.length }

val evensLength = even andThen length

evensLength(2)
// 4
```

Where is this really used?  `PartialFunction`s are very common in collections apis and in dealing with events.

Collections example:

```scala
// think conditional map
List(1, 2, 3, 4) collect even
// List(even, even)
```

Events example:

```scala
// HTTP api that only works with GET requests at /hello.  Other cases will get a 404
val service: PartialFunction[Request, Response] = {
  case Get -> Root / "hello" => Ok("Hello World!")
}
```
