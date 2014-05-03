# Applicative Functor
So what is a applicative functor?  Its a `Functor` but with more methods!

```scala
import scala.language.higherKinds
trait Applicative[F[_]] extends Functor[F] {
    def pure[A](a: => A): F[A]
    def <*>[A,B](fa: => F[A])(f: => F[A => B]): F[B]
}
```

Lets go over each method one by one.

```scala
def pure[A](a: => A): F[A]
```

Look at the type of the function: `A => F[A]`.  This should look like a constructor to you!  Thats because `pure` really is just a constructor for only one element.

```scala
// wont work yet since we haven't defined Applicative[List]
Applicative[List].pure(1)
// List(1)
```

Now lets look at the scary method.

```scala
def <*>[A,B](fa: => F[A])(f: => F[A => B]): F[B]
```

Lets look at this type a bit closer.

```scala
F[A] => F[A => B] => F[B]
```

If you follow the arrows, it looks kinda like `map` from `Functor`, so lets figure out if we can deduce how they are the same.  To go over that, lets go back to `map`.

```scala
val add = (x: Int, y: Int) => x + y
val inc = add.curried(1)
```

We just created two basic functions `add` and `inc` that will add two numbers together and increment the value of one number.  If we have a `Functor` we can map over the values and increment them.

```scala
Functor[List].map(List(1, 2, 3))(inc)
```

This is great and all, but lets say that I want to use my `add` function.  How would this work?  Well, how was the `inc` function defined?  Its the produce of currying `add`.  So what happens if we curry `add` in the `map`.

```scala
Functor[List].map(List(1, 2, 3))(add.curried)
// List[Int => Int]
```

What just happened here?  We partially applied `add` to the elements in the list.  This gave us a new list of functions from `Int => Int`.  This is the same type we saw in the scary `<*>` method!

Lets say we have two lists:

```scala
val list1 = List(1, 2, 3)
val list2 = List(4, 5, 6)
```

And we want to add them together.  The `<*>` method will let us do this!

```scala
Applicative[List].<*>(list2)(Functor[List].map(list1)(add.curried))
// List(5, 6, 7, 6, 7, 8, 7, 8, 9)
```

This might not be what you expected, but with `List`, the `<*>` normally adds every combination together.

Now that we have seen these methods used and how they work, lets try to implement them!

```scala
implicit val listApplicative: Applicative[List] =
  new Applicative[List] {
    def pure[A](a: => A): List[A] = List(a)

    def <*>[A,B](fa: => List[A])(f: => List[A => B]): List[B] = for {
        elem <- fa
        func <- f
    } yield func(elem)

    // we can reimplement map as <*> where f is wrapped around a list
    def map[A, B](fa: List[A])(f: A => B): List[B] = <*>(fa)(pure(f))
  }
```

Now lets retry the examples above.

```scala
object Applicative {
    def apply[F[_]](implicit a: Applicative[F]) = a
}

val add = (x: Int, y: Int) => x + y

val list1 = List(1, 2, 3)
val list2 = List(4, 5, 6)

Applicative[List].<*>(list2)(Functor[List].map(list1)(add.curried))
// List(5, 6, 7, 6, 7, 8, 7, 8, 9)
```

Now that we know what an applicative functor is, lets look at the laws.

## Its the Law
Applicative functors are functors so they share the same laws that functors have.  With these new methods comes new laws.  Lets go over them one by one.

### Identity `<*>`
This law is basically the same as the law for identity map, but for `<*>`.  If the identity function is passed into `<*>`, the resulting applicative functor should equal the input applicative functor.

```scala
val expectedList = List(1, 2, 3)

val outputList = Applicative[List].<*>(expectedList)(List((x: Int) => x))

expectedList == outputList
// true
```

### Pure Composition
Pure composition is saying that if you `<*>` a pureed data source and pured function, the result should be the same as if you did pure of applying the function with the data.

```scala
val af = Applicative[List]
val data = 1
val inc = (x: Int) => x + 1

val res1 = af.<*>(af.pure(data))(af.pure(inc))
val res2 = af.pure(inc(data))

res1 == res2
// true
```

### Map and `<*>` are related
We defined map in the `Applicative` trait as reusing `<*>`.  If you choose to not do this, you should make sure the results are the same.

```scala
val af = Applicative[List]

val list = List(1, 2, 3)
val inc = (x: Int) => x + 1

val res1 = af.map(list)(inc)
val res2 = af.<*>(list)(af.pure(inc))

res1 == res2
// true
```

### `<*>` can swap order
This one sounds a bit weird; `<*>`'s arguments are of different types!  This is true, but with pure you can make them the same type.  If you do this you should get the same output.

```scala
val af = Applicative[List]

val data = 1
val partialAf = af.pure((x: Int) => x + 1)

val res1 = af.<*>(af.pure(data))(partialAf)
val res2 = af.<*>(partialAf)(af.pure((func: Int => Int) => func(data)))

res1 == res2
// true
```

### Lifting functions is the same as compose
This sounds complex, and looks complex, but what this is saying is that when you have `F[A => B]` and `F[B => C]`, if you "lift" the functions out and compose them, its the same as applying `<*>` to those applicative functors.

```scala
val af = Applicative[List]

val lab: List[Int => String] = List((x: Int) => x.toString)
val lbc: List[String => Int] = List((x: String) => x.length)
val list = List(1, 2, 3)

val comp = (bc: String => Int) => (ab: Int => String) => bc compose ab

val res1 = af.<*>( af.<*>(list)(lab) )(lbc)
val res2 = af.<*>(list)( af.<*>(lab)( af.<*>(lbc)( af.pure(comp) ) ) )

res1 == res2
```

These laws seem very complex, but again in most cases they should just work.
