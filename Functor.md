# Functor
Before you can learn about a `Monad`, you will first need to know what a `Functor` is, or at least its interface (all `Monad`s are `Functor`).

So what is a `Functor`?  Something that is mappable.

```scala
import scala.language.higherKinds
trait Functor[F[_]] {
    def map[A, B](fa: F[A])(f: A => B): F[B]
}
```

This should look very similar if you have worked with scala's collections apis.  All collections can be mapped over.

```scala
List(1, 2, 3).map(_ + 1)
// List(2, 3, 4)
```

But you should notice something a slightly bit different: `Functor.map` is curried and first argument is a `F[A]`.  This should make sense if you read the [Type Classes](Type+Classes.html) section; `Functor` is a type class, so you need to tell it the instance to work with.

So since `Functor` is a type class, how to use it should look very similar. First we create the instance.

```scala
implicit val listFunctor: Functor[List] = new Functor[List] {
  def map[A, B](fa: List[A])(f: A => B): List[B] = fa.map(f)
}
```

Second we implicitly request it when we need it.

```scala
def inc(list: List[Int])(implicit func: Functor[List]) = func.map(list)(_ + 1)

inc(List(1, 2, 3))
// List(2, 3, 4)
```

`Functor` sounds scarier than it really is.  It really is anything that can be mapped over.  In pure functional programming, there are laws that `Functor`s should comply to.  You are free to break these laws if you wish, just make sure that you know you are doing them.

## Its the Law
`Functor`s should comply with two laws: identity and composition.

### Identity
Identity is a simple law.  Given any value `a`, return `a`.  So what does this mean for a `Functor`?

```scala
object Functor {
    def apply[F[_]](implicit f: Functor[F]) = f
}
val expectedList = List(1, 2, 3)
val outputList = Functor[List].map(expectedList)(x => x)

expectedList == outputList
// true
```

For all values in `F[A]`, return `F[A]`.

### Composition
If you compose two functions and then map the resulting function over a `Functor` should equal the result of first mapping one function over a `Functor` and then mapping the other one.

For a `Functor` to be support the composition law, the following must be true.

```scala
val f1 = (x: Int) => x + 1
val f2 = (x: Int) => x * 2
val inputList = List(1, 2, 3)

val compRes = Functor[List].map(inputList)(f2 compose f1)
val mapRes = Functor[List].map(Functor[List].map(inputList)(f1))(f2)

compRes == mapRes
// true
```

These laws may sound scary, but for most implementations of `map` they just work.
