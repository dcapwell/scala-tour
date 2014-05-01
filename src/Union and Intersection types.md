# Union and Intersection types
In scala you can define type intersection (and) in a very simple way

```scala
type Both = String with Int
```

but there is no built in union (or).

If you read [Unboxed union types in Scala via the Curry-Howard isomorphism](http://www.chuusai.com/2011/06/09/scala-union-types-curry-howard/) the author shows a way to get union within scala!

```scala
type ¬[A] = A => Nothing
type ¬¬[A] = ¬[¬[A]]
type ∨[T, U] = ¬[¬[T] with ¬[U]]
type |∨|[T, U] = { type λ[X] = ¬¬[X] <:< (T ∨ U) }
```

Now lets see how to use this.

```scala
def size[T : (Int |∨| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}
```

Not too bad, now lets see what happens when we use this.

```scala
scala> size(10)
res0: Int = 10

scala> size("eggs")
res1: Int = 4

scala> size(10.0)
<console>:39: error: Cannot prove that (Double => Nothing) => Nothing <:< Int => Nothing with String => Nothing => Nothing.
              size(10.0)
                  ^
```

Great, it does what we expect (but error is hard to understand);  it will only let us consume `Int` and `String` types, but nothing else.

When I was just a java programmer I thought that one of the key features of ceylon was [union and intersection types](http://ceylon-lang.org/documentation/current/introduction/#principal_typing_union_types_and_intersection_types).  Now I see that I can do the same with scala.

## Scalaz
The authors of scalaz saw this same blog post and have added union types into scalaz so you don't have to add the above types first.  Lets reimplement the size function using scalaz's union type.

```scala
import scalaz._, Scalaz._
import UnionTypes._

type StringOrInt = t[String]#t[Int]
def size[A](a: A)(implicit ev: A ∈ StringOrInt): Int = a match {
    case i: Int    => i
    case s: String => s.length
}

// or
def size[A](a: A)(implicit ev: A ∈ t[String]#t[Int]): Int = a match {
    case i: Int    => i
    case s: String => s.length
}

// or
// I really like the |v| syntax
type |∨|[T, U] = { type λ[X] = X ∈ t[T]#t[U] }
def size[T : (Int |∨| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}

// or
// the same as |v| but with the scalaz syntax
type |∈|[T, U] = { type λ[X] = X ∈ t[T]#t[U] }
def size[T : (Int |∈| String)#λ](t : T) = t match {
    case i : Int => i
    case s : String => s.length
}
```

## SIP
Found this scala suggestion [bug](https://issues.scala-lang.org/browse/SUGGEST-22) when looking for union types.  Doesn't look like its getting too much traction and didn't see a SIP for it yet.
