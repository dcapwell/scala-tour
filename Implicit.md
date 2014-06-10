# Implicit

Implicits are awesome if you come from a java background; the compiler will pass all the junk around for me!  But as we saw when we looked at type classes, there are really powerful ways to express problems in a more composable way.  So, why not use implicits all over the place?  Lets see when they fail you.

## Matching types

There can only be one implicit in scope for a given type, else the code won't compile.  Doesn't matter if one is imported and the other is at the top of the class.

```scala
import java.io._

object Instances {
    implicit val file: File = new File("/")
}

import Instances._

class FileThingy {

    implicit val moreSpecificFile: File = new File("/tmp")

    private def matchFile(implicit file: File) = println(file)

    def run = matchFile
}

new FileThingy().run
```

You get the following compiler error

```scala
scala> class FileThingy {
     |     import Instances._
     |
     |     implicit val moreSpecificFile: File = new File("/tmp")
     |
     |     private def matchFile(implicit file: File) = println(file)
     |
     |     def run = matchFile
     | }
<console>:27: error: ambiguous implicit values:
 both value moreSpecificFile in class FileThingy of type => java.io.File
 and value file in object Instances of type => java.io.File
 match expected type java.io.File
           def run = matchFile
                     ^
```

Even though we think we override the implicit with a more specific one (scope wise), doesn't matter!  Implicits don't follow scope rules!

### Scalaz

As we saw with Scalaz's Tag Types, we can solve this by tagging the types if they mean logically different things (this file belongs to plugins, this other one is for logs).  This trick will change the type so the compiler will be able to find the more specific type.  The one issue with it is that it doesn't solve the override issue, it only lets you use the same type in different contexts.

## Variance

Ever worked with implicits and hieractical types?

```scala
class Foo
class Bar extends Foo
class Baz extends Bar

implicit def x1: Foo = {println("foo"); ???}
implicit def x2: Bar = {println("bar"); ???}
implicit def x3: Baz = {println("baz"); ???}

implicitly[Foo]
implicitly[Bar]
implicitly[Baz]
```

Every one returns `x3` and outputs "baz"...

Maybe you worked with a generic types then want to define more specific ones?

```scala
trait Container[A]

implicit def x1: Container[Any] = { println("any"); ???}
implicit def x2: Container[Int] = { println("int"); ???}

implicitly[Container[Int]]
implicitly[Container[Double]]
```

Ok, this one really does what it should do, but you might not think that it is at first.  Remember the varience rules?  In this case a `Container[Double]` and `Container[Any]` are not related, so getting the implicit for `Container[Any]` doesn't make sense.  You might think that it would be good to add varience into the type to help...

```scala
trait Ord[-A]

implicit def x1: Ord[Any] = { println("any"); ???}

implicit def x2: Ord[List[Double]] = { println("List Double"); ???}

implicitly[Ord[List[Double]]]
```

With the above, you would assume `x2` gets run.  This would make sense since its more sepcific than `x1`!  With scala's contravariant (`-A`), what happens is the most specific won't win, but the least specific will win; in this case `Ord[Any]`.

```scala
scala> implicitly[Ord[List[Double]]]
any
scala.NotImplementedError: an implementation is missing
```
