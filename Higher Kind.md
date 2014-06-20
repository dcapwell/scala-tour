# Higher Kind
A higher kind is the type of a type constructor.  So what does that mean?  Lets look at a basic generic trait.

```scala
scala> trait MyList[A] {
  def head: A
  def tail: MyList[A]
}

scala> kind[MyList[String]
MyList's kind is * -> *. This is a type constructor: a 1st-order-kinded type.
```

The `MyList[String]` type is a 1st-order kinded type; the type of any `MyList` is parameterized by `A`.  Think of `MyList` as a function for types as `A => MyList[A]` so given a type `A` we can created a new type `MyList[A]`.  So if `MyList` is a 1st-order kinded type, then what is a higher kind?  Well, what is a higher order function?  Its a function that accepts another function.  So what is a higher kinded type?  Its a type that is parameterized by another type that is parameterized.  Lets look at a simple example of this.

```scala
scala> trait Foo[A[_]]
scala> kind[Foo[List]]
Foo's kind is (* -> *) -> *. This is a type constructor that takes type constructor(s): a higher-kinded type.
```

To make this more clear, lets create a trait `Folable` that will add the ability to `leftFold`.

```scala
trait Foldable[F[_]] {
    def leftFold[A, B](ob: F[A])(zero: B)(fn: (B, A) => B): B
}
```

Now lets tie this to `List`

```scala
implicit val listFolable: Foldable[List] = new Foldable[List] {
    def leftFold[A, B](ob: List[A])(zero: B)(fn: (B, A) => B): B =
        ob.foldLeft(zero)(fn)
}
```

We define a `Foldable` that works for any `List` instance.  The `leftFold` method will take an `A` and use the `A` to construct the `List[A]`.  Now lets "pimp" `List` to have a nicer shorthand.

```scala
import scala.language.implicitConversions
implicit class ListFoldableOpt[A](list: List[A])(implicit fold: Foldable[List]) {
    def leftFold[B](zero: B)(fn: (B, A) => B): B =
        fold.leftFold(list)(zero)(fn)
}

List(1, 2, 3).leftFold(0)(_ + _) // 6
```

Given a `List[A]` and a `Foldable[List]`, we can now add a `leftFold` method to `List[A]`.  This example is a common example of where higher-kinded types are normally used; type classes over generic types.

## Hackery
Scala supports higher kinded types, but the support is not on-par with what you would hope for.  Lets say you have the following type

```scala
trait Foo[A, B]
```

And now lets say we have a function that takes a higher type, but only with one type param.

```scala
def map[F[_], A, B](f: F[A])(fn: A => B): F[B] = ???
```

Lets try to call it with `Foo`

```scala
scala> map(new Foo[Int, Int]{})(x => x)
error: type mismatch;
 found   : Foo[Int,Int]
 required: ?F
Note that implicit conversions are not applicable because they are ambiguous:
 both method any2Ensuring in object Predef of type [A](x: A)Ensuring[A]
 and method any2ArrowAssoc in object Predef of type [A](x: A)ArrowAssoc[A]
 are possible conversion functions from Foo[Int,Int] to ?F
```

That is a very weird error, and not the one you will always see.  What this is saying is that its trying to verify that the types match, but not able to.  The reason for this is the higher kind that its looking for doesn't match what we are passing in: looking for `Foo[Int]` but passed in `Foo[Int, Int]`.

There is a way to get the types to match, but it looks a bit scary at first...

```scala
scala> map[({type F[X] = Foo[Int, X]})#F, Int, Int](new Foo[Int, Int]{})(x => x)
scala.NotImplementedError: an implementation is missing // expected, impl was ???
```

So what the heck is `({type F[X] = Foo[Int, X]})#F`?  Lets break it up, but lets first look at a simpler thing; a type within a trait.

```scala
trait Machine {
    type Hostname = String

    def hostname: Hostname = "localhost"
}
```

As we see with the above, the syntax for defining a type alias is `type Hostname = String`, so when you look at the scary type thing above, you will see that there as well: `type F[X] = Foo[Int, X]`.  The only real difference there is that the type alias supports params.

So to finish this off, the `({...})#F` is saying that scala should extract the type `F` from the `{...}` block inside.  And since `F` is of type `F[X]`, it will fit within the method!

TL;DR

When you are working with higher-kinded types and the number of types don't match, you can hack around it by creating a type alias inside a block, and extract it out with `(...)#TypeName`.
