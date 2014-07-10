# Macro Basics
When defining a macro, there are always two functions created: user facing, compiler facing.  These two functions should always be mirror images of each other (name, input, output all match) with one exception; compiler facing wraps types.

So what is the basic structure of a macro?

## User Facing
User facing API is very similar to writing a normal function but the implementation is missing and replaced by the keyword `macro` which references the compiler facing API.

```scala
def printparam(param: Any): Unit = macro printparam_impl
```

## Compiler Facing
As stated above, the compiler facing API must be a mirror image of the user facing API, but wrap input/output in compiler types.

```scala
def printparam_impl(c: Context)(param: c.Expr[Any]): c.Expr[Unit] = {
    import c.universe._

    reify { println(param.splice) }
}
```

Here we see the second group of params looks a lot like the params from the user facing one:

* name is `param`
* type is `c.Expr[Any]` and user was `Any`

### Curried API?
So whats up with the curried API?  The macro system was written following the cake pattern.  Because of this, you will need access to the `Context` of the compiler, and need to reference types from its `universe`.  All macro compiler functions will have the same boilerplate of taking the `Context` in the first param group, and importing its `universe` as its first statement.  This setup has one big drawback to it...

#### Code sharing
Scala's compiler will load the compiler function into its code, but nothing else.  This means that when the compiler runs your function, you won't have access to functions defined outside.  This is a big issue when building bigger macros, so a pattern has come up of not using macro functions but macro bundles.

### Macro Bundles
When defining the user facing API, you can tell it that the macro can be found inside a given class (`Foo.bar`).  This lets you define the `Context` as a param to the class and import its `universe` one time.  Each function inside this class will look like the function above, but with the first param group omitted.

There is one issue with this though, macro bundles was only added in scala 2.11.  If you want support for this in 2.10 you will need a compiler plugin called [Macro Paradise](http://docs.scala-lang.org/overviews/macros/paradise.html). Need to test it, but I believe that users of the macro code that depends on macro paradise will also need to include macro paradise.  This still needs to be tested.
