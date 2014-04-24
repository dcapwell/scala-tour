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

The `MyList[String]` type is a 1st-order kinded type; the type of any `MyList` is paramaterized by `A`.  Think of `MyList` as a function for types as `A => MyList[A]` so given a type `A` we can created a new type `MyList[A]`.  So if `MyList` is a 1st-order kinded type, then what is a higher kind?  Well, what is a higher order function?  Its a function that accepts another function.  So what is a higher kinded type?  Its a type that is paramaterized by another type that is paramaterized.  Lets look at a simple example of this.

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

import scala.language.implicitConversions
implicit class ListFoldableOpt[A](list: List[A])(implicit fold: Foldable[List]) {
    def leftFold[B](zero: B)(fn: (B, A) => B): B =
        fold.leftFold(list)(zero)(fn)
}

List(1, 2, 3).foldLeft(0)(_ + _) // 6
```
